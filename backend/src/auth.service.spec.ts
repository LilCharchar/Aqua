import * as bcrypt from "bcrypt";
import { AuthService } from "../controllers/auth/auth.service";
import { SupabaseService } from "./supabase.service";

type FromBuilder = Record<string, jest.Mock>;

function createLoginBuilder(response: {
  data: unknown[] | null;
  error: Error | null;
}): FromBuilder {
  const limit = jest.fn().mockResolvedValue(response);
  const eq = jest.fn().mockReturnValue({ limit });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
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

  describe("login", () => {
    it("valida contraseñas hasheadas", async () => {
      const hashed = await bcrypt.hash("secreto", 10);
      const user = {
        id: "1",
        correo: "user@test.dev",
        contraseña: hashed,
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
      const hashed = await bcrypt.hash("otro", 10);
      const user = {
        id: "1",
        correo: "user@test.dev",
        contraseña: hashed,
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
      const insertPayloads: any[] = [];
      const insert = jest.fn().mockImplementation((rows: any[]) => {
        insertPayloads.push(rows[0]);
        return { select: selectAfterInsert };
      });
      const insertBuilder = { insert };

      fromMock.mockReturnValueOnce(existingBuilder).mockReturnValueOnce(
        insertBuilder,
      );

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
      await expect(
        bcrypt.compare("supersecreto", storedPassword),
      ).resolves.toBe(true);
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
  });
});
