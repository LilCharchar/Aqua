import { AuthService } from "../../controllers/auth/auth.service";
import { SupabaseService } from "../../src/supabase.service";

type FromBuilder = Record<string, jest.Mock>;

const HASHED_SECRETO =
  "$2b$10$gA.8HuJBVVlP6IUXulUsQuRSbWcmZ7m7upwi0rBL7hLng.ew663pa";
const HASHED_OTRO =
  "$2b$10$Yor8re6gwzNN8slR5pWBWucuZ4.6ABU7qNbjQ.Y/vLH1DNANMK5ya";

function createGetUsersBuilder(response: {
  data: unknown[] | null;
  error: Error | null;
}): FromBuilder {
  const order = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ order });
  return { select };
}

function createLoginBuilder(response: {
  data: unknown[] | null;
  error: Error | null;
}): FromBuilder {
  const limit = jest.fn().mockResolvedValue(response);
  const eq = jest.fn().mockReturnValue({ limit });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

function createUpdateBuilder(response: { data: unknown; error: Error | null }) {
  const single = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ single });
  const eq = jest.fn().mockReturnValue({ select });
  const payloads: Record<string, unknown>[] = [];
  const update = jest
    .fn()
    .mockImplementation((payload: Record<string, unknown>) => {
      payloads.push(payload);
      return { eq };
    });
  return { update, payloads };
}

describe("AuthService", () => {
  let authService: AuthService;
  let supabaseService: { getClient: jest.Mock };
  let fromMock: jest.Mock;

  beforeEach(() => {
    fromMock = jest.fn();
    supabaseService = {
      getClient: jest.fn().mockReturnValue({ from: fromMock }),
    };
    authService = new AuthService(
      supabaseService as unknown as SupabaseService,
    );
  });

  describe("getUsers", () => {
    it("regresa la lista de usuarios disponibles", async () => {
      const users = [
        {
          id: "1",
          nombre: "Admin",
          correo: "admin@test.dev",
          rol_id: 1,
          activo: true,
        },
      ];

      fromMock.mockReturnValueOnce(
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

    it("retorna error cuando Supabase falla", async () => {
      fromMock.mockReturnValueOnce(
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
    it("valida contraseñas hasheadas", async () => {
      const user = {
        id: "1",
        correo: "user@test.dev",
        contraseña: HASHED_SECRETO,
        nombre: "Test",
        rol_id: 1,
        activo: true,
      };

      fromMock.mockReturnValueOnce(
        createLoginBuilder({ data: [user], error: null }),
      );

      const result = await authService.login({
        correo: "user@test.dev",
        contraseña: "secreto",
      });

      expect(result).toEqual({
        ok: true,
        userId: "1",
        correo: "user@test.dev",
        nombre: "Test",
        rol: 1,
      });
    });

    it("permite contraseñas antiguas sin hash", async () => {
      const user = {
        id: "1",
        correo: "user@test.dev",
        contraseña: "plain",
        nombre: "Test",
        rol_id: 2,
        activo: true,
      };

      fromMock.mockReturnValueOnce(
        createLoginBuilder({ data: [user], error: null }),
      );

      const result = await authService.login({
        correo: "user@test.dev",
        contraseña: "plain",
      });

      expect(result.ok).toBe(true);
      expect(result.rol).toBe(2);
    });

    it("rechaza credenciales inválidas", async () => {
      const user = {
        id: "1",
        correo: "user@test.dev",
        contraseña: HASHED_OTRO,
        nombre: "Test",
        rol_id: 1,
        activo: true,
      };

      fromMock.mockReturnValueOnce(
        createLoginBuilder({ data: [user], error: null }),
      );

      const result = await authService.login({
        correo: "user@test.dev",
        contraseña: "incorrecto",
      });

      expect(result).toEqual({
        ok: false,
        message: "Credenciales inválidas",
      });
    });

    it("bloquea usuarios inactivos aunque la contraseña sea válida", async () => {
      const user = {
        id: "1",
        correo: "user@test.dev",
        contraseña: HASHED_SECRETO,
        nombre: "Test",
        rol_id: 1,
        activo: false,
      };

      fromMock.mockReturnValueOnce(
        createLoginBuilder({ data: [user], error: null }),
      );

      const result = await authService.login({
        correo: "user@test.dev",
        contraseña: "secreto",
      });

      expect(result).toEqual({
        ok: false,
        message: "Usuario desactivado",
      });
    });

    it("retorna error cuando el usuario no existe", async () => {
      fromMock.mockReturnValueOnce(
        createLoginBuilder({ data: [], error: null }),
      );

      const result = await authService.login({
        correo: "missing@test.dev",
        contraseña: "irrelevante",
      });

      expect(result).toEqual({
        ok: false,
        message: "Usuario no encontrado",
      });
    });
  });

  describe("register", () => {
    it("guarda contraseñas hasheadas y devuelve el usuario", async () => {
      const maybeSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });
      const eqExisting = jest.fn().mockReturnValue({ maybeSingle });
      const selectExisting = jest.fn().mockReturnValue({ eq: eqExisting });
      const existingBuilder = { select: selectExisting };

      const insertedUser = {
        id: "2",
        nombre: "Nuevo",
        correo: "nuevo@test.dev",
        rol_id: 1,
        activo: true,
      };
      const single = jest
        .fn()
        .mockResolvedValue({ data: insertedUser, error: null });
      const selectAfterInsert = jest.fn().mockReturnValue({ single });
      type InsertRow = { contraseña: string };
      const insertPayloads: InsertRow[] = [];
      const insert = jest.fn().mockImplementation((rows: InsertRow[]) => {
        insertPayloads.push(rows[0]);
        return { select: selectAfterInsert };
      });
      const insertBuilder = { insert };

      fromMock
        .mockReturnValueOnce(existingBuilder)
        .mockReturnValueOnce(insertBuilder);

      const result = await authService.register({
        nombre: "Nuevo",
        correo: "nuevo@test.dev",
        contraseña: "supersecreto",
        rol_id: 1,
        activo: true,
      });

      expect(result).toEqual({
        ok: true,
        userId: "2",
        nombre: "Nuevo",
        correo: "nuevo@test.dev",
        rol: 1,
        activo: true,
      });

      expect(insert).toHaveBeenCalledTimes(1);
      const storedPassword = insertPayloads[0].contraseña;
      expect(storedPassword).not.toBe("supersecreto");
      expect(storedPassword.startsWith("$2")).toBe(true);
      expect(storedPassword.length).toBeGreaterThan(20);
    });

    it("evita registros duplicados", async () => {
      const maybeSingle = jest
        .fn()
        .mockResolvedValue({ data: { id: "existing" }, error: null });
      const eqExisting = jest.fn().mockReturnValue({ maybeSingle });
      const selectExisting = jest.fn().mockReturnValue({ eq: eqExisting });

      fromMock.mockReturnValueOnce({ select: selectExisting });

      const result = await authService.register({
        nombre: "Nuevo",
        correo: "repetido@test.dev",
        contraseña: "clave",
        rol_id: 1,
      });

      expect(result).toEqual({
        ok: false,
        message: "Correo ya registrado",
      });
    });

    it("propaga errores al validar correo existente", async () => {
      const maybeSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error("db down") });
      const eqExisting = jest.fn().mockReturnValue({ maybeSingle });
      const selectExisting = jest.fn().mockReturnValue({ eq: eqExisting });

      fromMock.mockReturnValueOnce({ select: selectExisting });

      const result = await authService.register({
        nombre: "Nuevo",
        correo: "fallo@test.dev",
        contraseña: "clave",
      });

      expect(result).toEqual({
        ok: false,
        message: "Error verificando correo",
      });
    });

    it("retorna error cuando la inserción falla", async () => {
      const maybeSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });
      const eqExisting = jest.fn().mockReturnValue({ maybeSingle });
      const selectExisting = jest.fn().mockReturnValue({ eq: eqExisting });

      const single = jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error("insert fail") });
      const selectAfterInsert = jest.fn().mockReturnValue({ single });
      const insert = jest.fn().mockReturnValue({ select: selectAfterInsert });

      fromMock
        .mockReturnValueOnce({ select: selectExisting })
        .mockReturnValueOnce({ insert });

      const result = await authService.register({
        nombre: "Nuevo",
        correo: "nuevo@test.dev",
        contraseña: "clave",
      });

      expect(result).toEqual({
        ok: false,
        message: "No se pudo crear el usuario",
      });
    });
  });

  describe("updateUser", () => {
    it("actualiza datos y rehashea la contraseña cuando se provee", async () => {
      const builder = createUpdateBuilder({
        data: {
          id: "1",
          nombre: "Actualizado",
          correo: "user@test.dev",
          rol_id: 2,
          activo: true,
        },
        error: null,
      });

      fromMock.mockReturnValueOnce(builder);

      const result = await authService.updateUser("1", {
        nombre: "Actualizado",
        contraseña: "nueva",
        rol_id: 2,
      });

      expect(result).toEqual({
        ok: true,
        userId: "1",
        nombre: "Actualizado",
        correo: "user@test.dev",
        rol: 2,
        activo: true,
      });

      expect(builder.update).toHaveBeenCalledTimes(1);
      const payload = builder.payloads[0] as {
        contraseña: string;
        nombre: string;
        rol_id: number;
      };
      expect(payload.nombre).toBe("Actualizado");
      expect(payload.rol_id).toBe(2);
      expect(payload.contraseña).toBeDefined();
      expect(payload.contraseña).not.toBe("nueva");
      expect(payload.contraseña.startsWith("$2")).toBe(true);
    });

    it("devuelve error si no hay campos que actualizar", async () => {
      const result = await authService.updateUser("1", {});
      expect(result).toEqual({
        ok: false,
        message: "No hay cambios para aplicar",
      });
    });

    it("retorna error cuando Supabase no actualiza", async () => {
      const builder = createUpdateBuilder({
        data: null,
        error: new Error("update fail"),
      });

      fromMock.mockReturnValueOnce(builder);
      const result = await authService.updateUser("1", {
        nombre: "Sin suerte",
      });

      expect(result).toEqual({
        ok: false,
        message: "No se pudo actualizar el usuario",
      });
    });
  });

  describe("cambios de estado", () => {
    it("desactiva un usuario", async () => {
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

      fromMock.mockReturnValueOnce(builder);
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

    it("restaura un usuario desactivado", async () => {
      const builder = createUpdateBuilder({
        data: {
          id: "1",
          nombre: "Test",
          correo: "user@test.dev",
          rol_id: 1,
          activo: true,
        },
        error: null,
      });

      fromMock.mockReturnValueOnce(builder);
      const result = await authService.restoreUser("1");

      expect(builder.payloads[0]).toEqual({ activo: true });
      expect(result).toEqual({
        ok: true,
        userId: "1",
        nombre: "Test",
        correo: "user@test.dev",
        rol: 1,
        activo: true,
      });
    });

    it("propaga errores al cambiar estado", async () => {
      const builder = createUpdateBuilder({
        data: null,
        error: new Error("state fail"),
      });

      fromMock.mockReturnValueOnce(builder);
      const result = await authService.deactivateUser("1");

      expect(result).toEqual({
        ok: false,
        message: "No se pudo actualizar el estado",
      });
    });
  });
});
