import { z } from "zod";
import { FOOTBALL_POSITIONS } from "@/types/domain";

export const playerSchema = z.object({ name: z.string().trim().min(1, "El nombre es obligatorio."), position: z.enum(FOOTBALL_POSITIONS), physicalStatus: z.enum(["available", "minor_issue", "injured"]) });
export const competitionSchema = z.object({ name: z.string().trim().min(1, "El nombre es obligatorio.") });
export const matchSchema = z.object({ competitionId: z.string().uuid("Seleccioná una competencia válida."), matchDate: z.string().date("Ingresá una fecha válida."), opponent: z.string().trim().min(1, "El rival es obligatorio.") });
export const statSchema = z.object({ playerId: z.string().uuid(), minutesPlayed: z.number().int().min(0, "Los minutos no pueden ser negativos.").max(120, "El máximo por partido es 120 minutos."), borg: z.number().int().min(0).max(10) });
