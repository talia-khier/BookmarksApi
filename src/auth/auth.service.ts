import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { AuthDTO } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
    if (!user) new ForbiddenException('Credentials are incorrect');

    // compare the password hash
    const passwordMatch = await argon.verify(user.hash, password);

    // if the password is incorrect, throw an error
    if (!passwordMatch) new ForbiddenException('Credentials are incorrect');

    // delete the password hash from the user object
    delete user.hash;

    // return the user
    return {
      user: user,
    };
  }
}
