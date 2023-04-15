import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AuthDTO } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private configModule: ConfigService,
  ) {}

  async signup(dto: AuthDTO) {
    // destructing dto
    const { email, password } = dto;

    // generate the password hash
    const hash = await argon.hash(password);

    // save the user to the database
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          hash: hash,
        },
      });

      delete user.hash;
      return user;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ForbiddenException('User already exists');
        }
      }
    }
  }
  async signin(dto: AuthDTO) {
    // destructing dto
    const { email, password } = dto;

    // find the usr in the database
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    // if the user does not exist, throw an error
    if (!user) throw new ForbiddenException('Credentials are incorrect');

    // compare the password hash
    const passwordMatch = await argon.verify(user.hash, password);
    console.log({ passwordMatch });

    // if the password is incorrect, throw an error
    if (!passwordMatch)
      throw new UnauthorizedException('Credentials are incorrect');

    // delete the password hash from the user object
    delete user.hash;

    // return the user
    return {
      access_token: await this.signToken(user.id, user.email),
      email: user.email,
    };
  }

  signToken(userId: number, email: string): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: userId,
        email,
      },
      {
        expiresIn: this.configModule.getOrThrow('JWT_EXPIRES_IN'),
        secret: this.configModule.getOrThrow('JWT_SECRET'),
      },
    );
  }

  async verifyToken(token: string): Promise<any> {
    return await this.jwt.verifyAsync(token, {
      secret: this.configModule.getOrThrow('JWT_SECRET'),
    });
  }
}
