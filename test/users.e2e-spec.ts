import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { resolve } from 'path';
import { Verification } from 'src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: "wsx2792@gmail.com",
  password: "12345",
}

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;
  let jwtToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationsRepository = module.get<Repository<Verification>>(getRepositoryToken(Verification));
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });


  describe('createAccount', () => {
    it('should create account', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query:`
        mutation {
          createAccount(input:{
            email:"${testUser.email}",
            password:"${testUser.password}",
            role:Client
          }) {
            ok
            error
          }
        }
        `,
      })
      .expect(200)
      .expect(res => {
        const {
          body: {
            data: {createAccount},
          },
        } = res;
        expect(createAccount.ok).toBe(true);
        expect(createAccount.error).toBe(null);
      });
    });

    it('should fail if account already exists', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query:`
        mutation {
          createAccount(input:{
            email:"${testUser.email}",
            password:"${testUser.password}",
            role:Client
          }) {
            ok
            error
          }
        }
        `,
      })
      .expect(200)
      .expect(res => {
        const {
          body: {
            data: { createAccount },
          },
        } = res;
        expect(createAccount.ok).toBe(false);
        expect(createAccount.error).toEqual(expect.any(String));
      });
    });
  });
  describe('login', () => {
    it('should login with correct credentials', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query:`
        mutation {
          login(input:{
            email:"${testUser.email}",
            password:"${testUser.password}",
          }) {
            ok
            error
            token
          }
          
        }
        `,
      })
      .expect(200)
      .expect(res => {
        const {
          body: {
            data: { login },
          },
        } = res;
        expect(login.ok).toBe(true);
        expect(login.error).toBe(null);
        expect(login.token).toEqual(expect.any(String));
        jwtToken = login.token;
      });
    });
    it('should not be able to login with wrong credentials', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query:`
        mutation {
          login(input:{
            email:"${testUser.email}",
            password:"xxxxx",
          }) {
            ok
            error
            token
          }
          
        }
        `,
      })
      .expect(200)
      .expect(res => {
        const {
          body: {
            data: { login },
          },
        } = res;
        expect(login.ok).toBe(false);
        expect(login.error).toBe("Wrong password");
        expect(login.token).toBe(null);
      });
    });
  });
  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it('should see a users profile', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).set('X-JWT', jwtToken).send({
        query: `
        {
          userProfile(userId:${userId}){
            ok
            error
            user{
              id
            }
          }
        }
        `,
      })
      .expect(200)
      .expect(res => {
        const {
          body: {
            data: {
              userProfile: {
                ok,
                error,
                user: {id},
              },
            },
          },
        } = res;
        // console.log(res.body);
        
        expect(ok).toBe(true);
        expect(error).toBe(null);
        expect(id).toBe(userId);
      });
    });
    it('should not see a users profile', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).set('X-JWT', jwtToken).send({
        query: `
        {
          userProfile(userId:66666){
            ok
            error
            user{
              id
            }
          }
        }
        `,
      })
      .expect(200)
      .expect(res => {
        const {
          body: {
            data: {
              userProfile: {
                ok,
                error,
                user,
              },
            },
          },
        } = res;
        expect(ok).toBe(false);
        expect(error).toBe('User not found.');
        expect(user).toBe(null);
      });
    });
  });
  describe('me', () => {
    it('should find my profile', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).set('X-JWT', jwtToken).send({
        query:`
        {
          me {
            email
          }
        }
        `,
      })
      .expect(200)
      .expect(res => { 
        const {
          body: {
            data: {
              me: {
                email,
              },
            },
          },
        } = res;
        expect(email).toBe(testUser.email);
      });
    });
    it('should not allow logged out user', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query:`
        {
          me {
            email
          }
        }
        `,
      })
      .expect(200)
      .expect(res => {
        const {
          body: { errors },
        } = res;
        const [error] = errors;
        expect(error.message).toBe('Forbidden resource');
      })
    });
  });
  describe('editProfile', () => {
    const NEW_EMAIL = "aaaaaa@gmail.com";
    it('should change email', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).set('X-JWT', jwtToken).send({
        query:`
        mutation {
          editProfile(input:{
            email:"${NEW_EMAIL}"
          }) {
            ok
            error
          }
        }
        `
      })
      .expect(200)
      .expect(res => {
        const {
          body: {
            data: {
              editProfile:{
                ok,
                error,
              }
            },
          },
        } = res;
        expect(ok).toBe(true);
        expect(error).toBe(null);
      });
    });
    it('should have new email', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).set('X-JWT', jwtToken).send({
        query:`
        {
          me {
            email
          }
        }
        `,
      })
      .expect(200)
      .expect(res => { 
        const {
          body: {
            data: {
              me: {
                email,
              },
            },
          },
        } = res;
        expect(email).toBe(NEW_EMAIL);
      });
    });
  });
  describe('verifyEmail', () => {
    let verificationCode : String;
    beforeAll(async() => {
      const [verification] = await verificationsRepository.find();
      verificationCode = verification.code;
    });
    it('should verify email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            verifyEmail(input:{
              code:"${verificationCode}"
            }){
              ok
              error
            }
          }
        `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should fail on verfication code not found', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            verifyEmail(input:{
              code:"${verificationCode}"
            }){
              ok
              error
            }
          }
        `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('verification not found.');
        });
    });
    
  });
});
