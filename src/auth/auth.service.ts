import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  signin() {
    return {
      msg: 'This is the signin route',
    };
  }
  signup() {
    return {
      msg: 'This is the signup route',
    };
  }
}
