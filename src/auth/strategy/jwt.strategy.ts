import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configModule: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configModule.get('JWT_SECRET'),
    });
  }

  async validate(payload: IPayloadDTO) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: payload.email,
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        id: true,
      },
    });
    return user;
  }
}

interface IPayloadDTO {
  sub: string;
  email: string;
}
