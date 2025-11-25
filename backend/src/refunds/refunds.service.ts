import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus } from '../entities/ride.entity';
import { Cancellation, CancellationType } from '../entities/cancellation.entity';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(Cancellation)
    private cancellationRepository: Repository<Cancellation>,
  ) {}

  async processRefund(
    rideId: string,
    cancellationType: CancellationType,
    reason: string,
  ) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    if (ride.status !== RideStatus.CANCELLED) {
      throw new BadRequestException('La course doit être annulée pour un remboursement');
    }

    // Vérifier si déjà remboursé
    const existingCancellation = await this.cancellationRepository.findOne({
      where: { rideId },
    });

    if (existingCancellation?.refunded) {
      throw new BadRequestException('Remboursement déjà effectué');
    }

    // Calculer le montant du remboursement selon les règles
    let refundAmount = 0;
    const now = new Date();
    const scheduledAt = new Date(ride.scheduledAt);
    const hoursUntilRide = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (cancellationType === CancellationType.CLIENT) {
      // Client annule : remboursement selon délai
      if (hoursUntilRide >= 24) {
        // Plus de 24h avant : remboursement 100%
        refundAmount = parseFloat(ride.price.toString());
      } else if (hoursUntilRide >= 2) {
        // Entre 2h et 24h : remboursement 50%
        refundAmount = parseFloat(ride.price.toString()) * 0.5;
      } else {
        // Moins de 2h : pas de remboursement
        refundAmount = 0;
      }
    } else if (cancellationType === CancellationType.DRIVER) {
      // Chauffeur annule : remboursement 100%
      refundAmount = parseFloat(ride.price.toString());
    } else if (cancellationType === CancellationType.ADMIN) {
      // Admin annule : remboursement 100%
      refundAmount = parseFloat(ride.price.toString());
    }

    // Créer ou mettre à jour l'annulation
    let cancellation = existingCancellation;
    if (!cancellation) {
      cancellation = this.cancellationRepository.create({
        rideId,
        cancelledBy: cancellationType,
        reason,
        refunded: refundAmount > 0,
        refundAmount,
        refundedAt: refundAmount > 0 ? new Date() : null as any,
      });
    } else {
      cancellation.refunded = refundAmount > 0;
      cancellation.refundAmount = refundAmount;
      if (refundAmount > 0) {
        cancellation.refundedAt = new Date();
      }
    }

    await this.cancellationRepository.save(cancellation);

    return {
      rideId,
      refundAmount,
      refunded: refundAmount > 0,
      refundedAt: cancellation.refundedAt,
      message: refundAmount > 0
        ? `Remboursement de ${refundAmount} FCFA effectué`
        : 'Aucun remboursement (conditions non remplies)',
    };
  }

  async getRefundStatus(rideId: string) {
    const cancellation = await this.cancellationRepository.findOne({
      where: { rideId },
    });

    if (!cancellation) {
      throw new NotFoundException('Aucune annulation trouvée pour cette course');
    }

    return {
      refunded: cancellation.refunded,
      refundAmount: cancellation.refundAmount,
      refundedAt: cancellation.refundedAt,
      reason: cancellation.reason,
      cancelledBy: cancellation.cancelledBy,
    };
  }

  async getAllRefunds(filters?: {
    startDate?: Date;
    endDate?: Date;
    refunded?: boolean;
  }) {
    const query = this.cancellationRepository
      .createQueryBuilder('cancellation')
      .leftJoinAndSelect('cancellation.rideId', 'ride')
      .orderBy('cancellation.createdAt', 'DESC');

    if (filters?.startDate) {
      query.andWhere('cancellation.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters?.endDate) {
      query.andWhere('cancellation.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }
    if (filters?.refunded !== undefined) {
      query.andWhere('cancellation.refunded = :refunded', {
        refunded: filters.refunded,
      });
    }

    return query.getMany();
  }
}

