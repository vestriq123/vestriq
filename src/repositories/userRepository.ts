import { BaseRepository } from "./baseRepository";

export class UserRepository extends BaseRepository {
  // Find a user by email, excluding soft deleted
  async findByEmail(email: string) {
    return this.db.user.findFirst({
      where: this.excludeDeleted({ email: email.toLowerCase() }),
      include: { role: true, profile: true },
    });
  }

  // Find a user by username, excluding soft deleted
  async findByUsername(username: string) {
    return this.db.user.findFirst({
      where: this.excludeDeleted({ username: username.toLowerCase() }),
      include: { role: true, profile: true },
    });
  }

  // Find a user by id, excluding soft deleted
  async findById(id: string) {
    return this.db.user.findFirst({
      where: this.excludeDeleted({ id }),
      include: { role: true, profile: true },
    });
  }

  // Create user and profile transactionally
  async createUser(data: {
    email: string;
    username: string;
    passwordHash: string;
    fullName: string;
    roleId: string;
  }) {
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          username: data.username.toLowerCase(),
          passwordHash: data.passwordHash,
          roleId: data.roleId,
        },
        include: { role: true },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
        },
      });

      return user;
    });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
