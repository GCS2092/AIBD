import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface GeocodeResult {
  lat: number;
  lng: number;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 seconde minimum entre les requêtes (limite Nominatim)

  /**
   * Géocode une adresse en coordonnées GPS en utilisant Nominatim
   * @param address L'adresse à géocoder
   * @param retries Nombre de tentatives en cas d'échec
   * @returns Les coordonnées GPS ou null si l'adresse n'a pas pu être géocodée
   */
  async geocodeAddress(
    address: string,
    retries: number = 2,
  ): Promise<GeocodeResult | null> {
    if (!address || address.trim().length === 0) {
      return null;
    }

    // Respecter la limite de rate limiting de Nominatim (1 requête/seconde)
    await this.waitForRateLimit();

    try {
      // Ajouter "Dakar, Sénégal" ou "AIBD, Sénégal" pour améliorer la précision
      const enhancedAddress = this.enhanceAddress(address);

      const response = await axios.get(`${this.NOMINATIM_BASE_URL}/search`, {
        params: {
          q: enhancedAddress,
          format: 'json',
          limit: 1,
          countrycodes: 'sn', // Limiter au Sénégal
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'AIBD-Ride-Service/1.0', // Nominatim exige un User-Agent
        },
        timeout: 5000, // Timeout de 5 secondes
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        if (isNaN(lat) || isNaN(lng)) {
          this.logger.warn(
            `Coordonnées invalides pour l'adresse: ${address}`,
          );
          return null;
        }

        this.logger.log(
          `Adresse géocodée avec succès: ${address} -> (${lat}, ${lng})`,
        );
        return { lat, lng };
      }

      this.logger.warn(`Aucun résultat trouvé pour l'adresse: ${address}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Erreur lors du géocodage de l'adresse "${address}": ${error.message}`,
      );

      // Retry si on a encore des tentatives
      if (retries > 0) {
        this.logger.log(
          `Nouvelle tentative de géocodage pour "${address}" (${retries} tentatives restantes)`,
        );
        await this.waitForRateLimit();
        return this.geocodeAddress(address, retries - 1);
      }

      return null;
    }
  }

  /**
   * Améliore l'adresse en ajoutant le contexte géographique (Dakar, Sénégal)
   */
  private enhanceAddress(address: string): string {
    const trimmedAddress = address.trim();

    // Si l'adresse contient déjà "AIBD" ou "Aéroport", on ajoute juste "Sénégal"
    if (
      trimmedAddress.toLowerCase().includes('aibd') ||
      trimmedAddress.toLowerCase().includes('aéroport') ||
      trimmedAddress.toLowerCase().includes('airport')
    ) {
      return `${trimmedAddress}, Sénégal`;
    }

    // Sinon, on ajoute "Dakar, Sénégal" pour améliorer la précision
    if (!trimmedAddress.toLowerCase().includes('dakar')) {
      return `${trimmedAddress}, Dakar, Sénégal`;
    }

    return `${trimmedAddress}, Sénégal`;
  }

  /**
   * Attend pour respecter la limite de rate limiting de Nominatim
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Géocode plusieurs adresses en respectant les limites de rate limiting
   */
  async geocodeAddresses(
    addresses: string[],
  ): Promise<Array<GeocodeResult | null>> {
    const results: Array<GeocodeResult | null> = [];

    for (const address of addresses) {
      const result = await this.geocodeAddress(address);
      results.push(result);
    }

    return results;
  }
}

