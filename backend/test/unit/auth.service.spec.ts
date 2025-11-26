import { AuthService } from "../../controllers/auth/auth.service";
import { SupabaseService } from "../../src/supabase.service";

type MaybeSingleResponse = { data: unknown | null; error: Error | null };
type SingleResponse = { data: unknown | null; error: Error | null };

function createGetUsersBuilder(response: {
  data: unknown[] | null;
  error: Error | null;
}) {
  const order = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ order });
  return { select, order };
}

function createMaybeSingleBuilder(response: MaybeSingleResponse) {
  const maybeSingle = jest.fn().mockResolvedValue(response);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  return { select, eq, maybeSingle };
}

function createSingleBuilder(response: SingleResponse) {
  const single = jest.fn().mockResolvedValue(response);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  return { select, eq, single };
}

function createInsertBuilder(response: SingleResponse) {
  const single = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ single });
  const payloads: Record<string, unknown>[] = [];
  const insert = jest
    .fn()
    .mockImplementation((rows: Record<string, unknown>[]) => {
      payloads.push(rows[0]);
      return { select };
    });
  return { insert, select, single, payloads };
}

function createUpdateBuilder(response: SingleResponse) {
  const single = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ single });
  const eq = jest.fn().mockReturnValue({ select });
  const payloads: Record<string, unknown>[] = [];
  const update = jest.fn().mockImplementation((payload) => {
    payloads.push(payload);
    return { eq };
  });
  return { update, eq, select, single, payloads };
}

describe("AuthService", () => {
  let authService: AuthService;
  let supabaseService: { getClient: jest.Mock };
  let supabaseClient: {
    from: jest.Mock;
    auth: {
      signInWithPassword: jest.Mock;
      signUp: jest.Mock;
      admin: {
        updateUserById: jest.Mock;
        deleteUser: jest.Mock;
      };
    };
  };

  beforeEach(() => {
    supabaseClient = {
      from: jest.fn(),
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        admin: {
          updateUserById: jest.fn(),
          deleteUser: jest.fn(),
        },
      },
    };

    supabaseService = {
      getClient: jest.fn().mockReturnValue(supabaseClient),
    };

    authService = new AuthService(
      supabaseService as unknown as SupabaseService,
    );
  });

  describe("getUsers", () => {
    it("returns the list of users", async () => {
      const users = [
        {
          id: "1",
          nombre: "Admin",
          correo: "admin@test.dev",
          rol_id: 1,
          activo: true,
        },
      ];

      supabaseClient.from.mockReturnValueOnce(
        createGetUsersBuilder({ data: users, error: null }),
      );

      const result = await authService.getUsers();
      expect(result).toEqual({
        ok: true,
        users: [
          {
            userId: "1",
            nombre: "Admin",
            correo: "admin@test.dev",
            rol: 1,
            activo: true,
          },
        ],
      });
    });

    it("propagates supabase errors", async () => {
      supabaseClient.from.mockReturnValueOnce(
        createGetUsersBuilder({ data: null, error: new Error("boom") }),
      );

      const result = await authService.getUsers();
      expect(result).toEqual({
        ok: false,
        message: "No se pudieron obtener los usuarios",
      });
    });
  });

  describe("login", () => {
    it("returns user info when Supabase Auth validates credentials", async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "1", email: "user@test.dev" } },
        error: null,
      });

      supabaseClient.from.mockReturnValueOnce(
        createMaybeSingleBuilder({
          data: {
            id: "1",
            correo: "user@test.dev",
            nombre: "Test",
            rol_id: 2,
            activo: true,
          },
          error: null,
        }),
      );

      const result = await authService.login({
        correo: "user@test.dev",
        contraseña: "secret",
      });

      expect(result).toEqual({
        ok: true,
        userId: "1",
        correo: "user@test.dev",
        nombre: "Test",
        rol: 2,
      });
    });

    it("rejects invalid credentials", async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error("invalid"),
      });

      const result = await authService.login({
        correo: "user@test.dev",
        contraseña: "wrong",
      });

      expect(result).toEqual({
        ok: false,
        message: "Credenciales inválidas",
      });
    });

    it("blocks inactive users", async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "1" } },
        error: null,
      });

      supabaseClient.from.mockReturnValueOnce(
        createMaybeSingleBuilder({
          data: {
            id: "1",
            correo: "user@test.dev",
            nombre: "Test",
            rol_id: 2,
            activo: false,
          },
          error: null,
        }),
      );

      const result = await authService.login({
        correo: "user@test.dev",
        contraseña: "secret",
      });

      expect(result).toEqual({
        ok: false,
        message: "Usuario desactivado",
      });
    });
  });

  describe("register", () => {
    it("registra al usuario con Supabase Auth y guarda metadata local", async () => {
      const maybeSingle = createMaybeSingleBuilder({
        data: null,
        error: null,
      });
      const insertBuilder = createInsertBuilder({
        data: {
          id: "1",
          nombre: "Nuevo",
          correo: "nuevo@test.dev",
          rol_id: 1,
          activo: true,
        },
        error: null,
      });

      supabaseClient.from
        .mockReturnValueOnce(maybeSingle)
        .mockReturnValueOnce(insertBuilder);

      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: "1" } },
        error: null,
      });

      const result = await authService.register({
        nombre: "Nuevo",
        correo: "nuevo@test.dev",
        contraseña: "Temporal123",
        rol_id: 1,
      });

      expect(result).toEqual({
        ok: true,
        userId: "1",
        nombre: "Nuevo",
        correo: "nuevo@test.dev",
        rol: 1,
        activo: true,
      });

      expect(insertBuilder.payloads[0]).toMatchObject({
        id: "1",
        correo: "nuevo@test.dev",
        nombre: "Nuevo",
        rol_id: 1,
      });
      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: "nuevo@test.dev",
        password: "Temporal123",
        options: expect.objectContaining({
          data: { nombre: "Nuevo" },
        }),
      });
    });

    it("stops when correo already exists", async () => {
      const maybeSingle = createMaybeSingleBuilder({
        data: { id: "existing" },
        error: null,
      });
      supabaseClient.from.mockReturnValueOnce(maybeSingle);

      const result = await authService.register({
        nombre: "Nuevo",
        correo: "dup@test.dev",
        contraseña: "Segura123",
      });

      expect(result).toEqual({
        ok: false,
        message: "Correo ya registrado",
      });
      expect(supabaseClient.auth.signUp).not.toHaveBeenCalled();
    });

    it("propaga errores de supabase al registrar", async () => {
      const maybeSingle = createMaybeSingleBuilder({
        data: null,
        error: null,
      });
      supabaseClient.from.mockReturnValueOnce(maybeSingle);

      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: new Error("signup-fail"),
      });

      const result = await authService.register({
        nombre: "Nuevo",
        correo: "nuevo@test.dev",
        contraseña: "Segura123",
      });

      expect(result).toEqual({
        ok: false,
        message: "signup-fail",
      });
    });

    it("cleans up auth user if inserting metadata fails", async () => {
      const maybeSingle = createMaybeSingleBuilder({
        data: null,
        error: null,
      });
      const insertBuilder = createInsertBuilder({
        data: null,
        error: new Error("insert-fail"),
      });

      supabaseClient.from
        .mockReturnValueOnce(maybeSingle)
        .mockReturnValueOnce(insertBuilder);

      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: "1" } },
        error: null,
      });

      const result = await authService.register({
        nombre: "Nuevo",
        correo: "nuevo@test.dev",
        contraseña: "Segura123",
      });

      expect(result).toEqual({
        ok: false,
        message: "No se pudo crear el usuario",
      });
      expect(
        supabaseClient.auth.admin.deleteUser,
      ).toHaveBeenCalledWith("1");
    });

    it("valida contraseñas débiles antes de llamar a Supabase", async () => {
      const result = await authService.register({
        nombre: "Nuevo",
        correo: "nuevo@test.dev",
        contraseña: "123",
      });

      expect(result).toEqual({
        ok: false,
        message: "La contraseña debe tener al menos 8 caracteres",
      });
      expect(supabaseClient.auth.signUp).not.toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    it("updates metadata and password when both are provided", async () => {
      const updateBuilder = createUpdateBuilder({
        data: {
          id: "1",
          nombre: "Actualizado",
          correo: "user@test.dev",
          rol_id: 2,
          activo: true,
        },
        error: null,
      });

      supabaseClient.from.mockReturnValueOnce(updateBuilder);
      supabaseClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: "1" } },
        error: null,
      });

      const result = await authService.updateUser("1", {
        nombre: "Actualizado",
        rol_id: 2,
        contraseña: "Nueva1234",
      });

      expect(result).toEqual({
        ok: true,
        userId: "1",
        nombre: "Actualizado",
        correo: "user@test.dev",
        rol: 2,
        activo: true,
      });
      expect(
        supabaseClient.auth.admin.updateUserById,
      ).toHaveBeenCalledWith("1", { password: "Nueva1234" });
      expect(updateBuilder.payloads[0]).toMatchObject({
        nombre: "Actualizado",
        rol_id: 2,
      });
    });

    it("allows updating only the password", async () => {
      supabaseClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: "1" } },
        error: null,
      });

      supabaseClient.from.mockReturnValueOnce(
        createSingleBuilder({
          data: {
            id: "1",
            nombre: "Test",
            correo: "user@test.dev",
            rol_id: 1,
            activo: true,
          },
          error: null,
        }),
      );

      const result = await authService.updateUser("1", {
        contraseña: "SoloPass123",
      });

      expect(result).toEqual({
        ok: true,
        userId: "1",
        nombre: "Test",
        correo: "user@test.dev",
        rol: 1,
        activo: true,
      });
    });

    it("rechaza contraseñas inválidas al actualizar", async () => {
      const result = await authService.updateUser("1", {
        contraseña: "abc",
      });

      expect(result).toEqual({
        ok: false,
        message: "La contraseña debe tener al menos 8 caracteres",
      });
      expect(
        supabaseClient.auth.admin.updateUserById,
      ).not.toHaveBeenCalled();
    });

    it("fails if there are no changes", async () => {
      const result = await authService.updateUser("1", {});
      expect(result).toEqual({
        ok: false,
        message: "No hay cambios para aplicar",
      });
    });
  });

  describe("toggle state", () => {
    it("deactivates a user", async () => {
      const builder = createUpdateBuilder({
        data: {
          id: "1",
          nombre: "Test",
          correo: "user@test.dev",
          rol_id: 1,
          activo: false,
        },
        error: null,
      });

      supabaseClient.from.mockReturnValueOnce(builder);

      const result = await authService.deactivateUser("1");
      expect(builder.payloads[0]).toEqual({ activo: false });
      expect(result).toEqual({
        ok: true,
        userId: "1",
        nombre: "Test",
        correo: "user@test.dev",
        rol: 1,
        activo: false,
      });
    });

    it("propagates errors while updating state", async () => {
      const builder = createUpdateBuilder({
        data: null,
        error: new Error("fail"),
      });
      supabaseClient.from.mockReturnValueOnce(builder);

      const result = await authService.deactivateUser("1");
      expect(result).toEqual({
        ok: false,
        message: "No se pudo actualizar el estado",
      });
    });
  });
});
