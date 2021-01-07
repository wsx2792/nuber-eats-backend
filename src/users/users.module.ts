import { Module, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { User } from './entities/user.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
    imports:[TypeOrmModule.forFeature([User])],
    providers:[UsersResolver, UsersService],
    exports:[UsersService]
})
export class UsersModule {}
