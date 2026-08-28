jest.mock('src/users/user.entity', () => ({ User: class User {} }), {
  virtual: true,
});

import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
jest.mock('../../audit/audit.service', () => ({ AuditService: class AuditService {} }));

describe('AuthService - email verification (issue #435)', () => {
  let service: AuthService;
  let signInProviders: { SignIn: jest.Mock };
  let refreshTokenProvider: {
    refreshToken: jest.Mock;
    logout: jest.Mock;
    logoutAll: jest.Mock;
  };
  let verifyEmailProvider: { verifyEmail: jest.Mock; issueVerificationToken: jest.Mock };
  let usersRepository: { findOne: jest.Mock };
  let auditService: { log: jest.Mock };

  const fakeUser: any = { id: 7, email: 'a@b.com' };

  beforeEach(() => {
    signInProviders = { SignIn: jest.fn() };
    refreshTokenProvider = {
      refreshToken: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
    };
    verifyEmailProvider = { verifyEmail: jest.fn(), issueVerificationToken: jest.fn() };
    usersRepository = { findOne: jest.fn() };
    auditService = { log: jest.fn(async () => undefined) };

    service = new AuthService(
      signInProviders as any,
      refreshTokenProvider as any,
      verifyEmailProvider as any,
      usersRepository as any,
      auditService as any,
    );
  });

  describe('verifyEmail', () => {
    it('delegates to VerifyEmailProvider and returns the verified user', async () => {
      verifyEmailProvider.verifyEmail.mockResolvedValueOnce(fakeUser);

      await expect(service.verifyEmail('raw')).resolves.toEqual(fakeUser);
      expect(verifyEmailProvider.verifyEmail).toHaveBeenCalledWith('raw');
    });

    it('propagates errors from VerifyEmailProvider', async () => {
      verifyEmailProvider.verifyEmail.mockRejectedValueOnce(
        new UnauthorizedException('bad'),
      );

      await expect(service.verifyEmail('bad')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('resendVerification', () => {
    it('returns an acknowledgement for an existing user', async () => {
      usersRepository.findOne.mockResolvedValueOnce(fakeUser);

      const result = await service.resendVerification(fakeUser.email);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: fakeUser.email },
        withDeleted: false,
      });
      expect(verifyEmailProvider.issueVerificationToken).toHaveBeenCalledWith(fakeUser);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RESEND_VERIFICATION', entityId: fakeUser.id }),
      );
      expect(result).toMatchObject({ status: 'ok' });
    });

    it('returns the same acknowledgement for an unknown email (no enumeration)', async () => {
      usersRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.resendVerification('ghost@example.com');

      expect(result).toMatchObject({ status: 'ok' });
    });

    it('returns the same acknowledgement for an already-verified user (idempotent)', async () => {
      usersRepository.findOne.mockResolvedValueOnce({
        ...fakeUser,
        emailVerified: true,
      });

      const result = await service.resendVerification(fakeUser.email);

      expect(result).toMatchObject({ status: 'ok' });
    });
  });
});
