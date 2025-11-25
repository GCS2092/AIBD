import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../entities/user.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

@WSGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Récupérer le token depuis le handshake ou les query params
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Connexion refusée: pas de token pour ${client.id}`);
        client.disconnect();
        return;
      }

      // Vérifier et décoder le token JWT
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET') || 'secret',
        });

        // Attacher les infos utilisateur au socket
        client.userId = payload.sub;
        client.userRole = payload.role;

        // Stocker la connexion
        if (client.userId) {
          this.connectedUsers.set(client.userId, client.id);
        }

        // Joindre les rooms selon le rôle
        if (client.userRole === UserRole.ADMIN) {
          client.join('admins');
          this.logger.log(`Admin ${client.userId} connecté (socket: ${client.id})`);
        } else if (client.userRole === UserRole.DRIVER) {
          client.join('drivers');
          client.join(`driver:${client.userId}`);
          this.logger.log(`Chauffeur ${client.userId} connecté (socket: ${client.id})`);
        } else {
          // Autres rôles (client, etc.)
          if (client.userId) {
            client.join(`user:${client.userId}`);
            this.logger.log(`Utilisateur ${client.userId} connecté (socket: ${client.id})`);
          }
        }

        // Notifier la connexion réussie
        client.emit('connected', {
          message: 'Connexion WebSocket établie',
          userId: client.userId,
          role: client.userRole,
        });
      } catch (error) {
        this.logger.error(`Token invalide pour ${client.id}:`, error);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la connexion ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`Utilisateur ${client.userId} déconnecté (socket: ${client.id})`);
    }
  }

  // Émettre une notification à un utilisateur spécifique
  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(`Notification envoyée à ${userId}: ${event}`);
    } else {
      this.logger.warn(`Utilisateur ${userId} non connecté, notification non envoyée`);
    }
  }

  // Émettre une notification à tous les admins
  emitToAdmins(event: string, data: any) {
    this.server.to('admins').emit(event, data);
    this.logger.log(`Notification envoyée à tous les admins: ${event}`);
  }

  // Émettre une notification à tous les chauffeurs
  emitToDrivers(event: string, data: any) {
    this.server.to('drivers').emit(event, data);
    this.logger.log(`Notification envoyée à tous les chauffeurs: ${event}`);
  }

  // Émettre une notification à un chauffeur spécifique
  emitToDriver(driverId: string, event: string, data: any) {
    this.server.to(`driver:${driverId}`).emit(event, data);
    this.logger.log(`Notification envoyée au chauffeur ${driverId}: ${event}`);
  }

  // Émettre une notification à un client spécifique
  emitToClient(clientId: string, event: string, data: any) {
    this.server.to(`client:${clientId}`).emit(event, data);
    this.logger.log(`Notification envoyée au client ${clientId}: ${event}`);
  }

  // Émettre une mise à jour de course
  emitRideUpdate(rideId: string, data: any) {
    this.server.emit(`ride:${rideId}:update`, data);
    this.logger.log(`Mise à jour de course ${rideId} envoyée`);
  }

  // Vérifier si un utilisateur est connecté
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Obtenir le nombre d'utilisateurs connectés
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}

