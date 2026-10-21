import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  createHash,
  timingSafeEqual,
} from 'node:crypto';

import type { Request } from 'express';

@Injectable()
export class HostKeyGuard implements CanActivate {
  private readonly expectedHash: Buffer;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.getOrThrow<string>(
      'HOST_ACCESS_KEY',
    );

    if (secret.length < 32) {
      throw new Error(
        'HOST_ACCESS_KEY must contain at least 32 characters.',
      );
    }

    this.expectedHash = createHash('sha256')
      .update(secret)
      .digest();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request>();

    const providedKey = request.header('x-host-key');

    if (!providedKey) {
      throw new UnauthorizedException(
        'Host access key is required.',
      );
    }

    const providedHash = createHash('sha256')
      .update(providedKey)
      .digest();

    if (
      !timingSafeEqual(
        providedHash,
        this.expectedHash,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid host access key.',
      );
    }

    return true;
  }
}