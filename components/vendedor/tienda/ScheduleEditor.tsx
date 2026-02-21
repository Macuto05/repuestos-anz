"use client";

import { useState, useEffect } from "react";
import { Clock, Copy, Plus, X } from "lucide-react";

export type DaySchedule = {
    abierto: boolean;
    horaApertura: string;
    horaCierre: string;
};

export type WeeklySchedule = {
    [key: string]: DaySchedule;
};

const DAYS = [
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
];

const DEFAULT_DAY: DaySchedule = {
    abierto: true,
    horaApertura: "08:00",
    horaCierre: "17:00",
};

const DEFAULT_SCHEDULE: WeeklySchedule = DAYS.reduce((acc, day) => {
    acc[day.key] = { ...DEFAULT_DAY, abierto: day.key !== "domingo" };
    return acc;
}, {} as WeeklySchedule);

interface ScheduleEditorProps {
    value: WeeklySchedule | null;
    onChange: (schedule: WeeklySchedule) => void;
}

export function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
    // Initialize with value or default, ensuring all days exist
    const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
        if (!value) return DEFAULT_SCHEDULE;
        // Merge provided value with default to ensure structure integrity
        return { ...DEFAULT_SCHEDULE, ...value };
    });

    useEffect(() => {
        if (value) {
            setSchedule(prev => ({ ...prev, ...value }));
        }
    }, [value]);

    const handleDayChange = (dayKey: string, field: keyof DaySchedule, fieldValue: any) => {
        const newSchedule = {
            ...schedule,
            [dayKey]: {
                ...schedule[dayKey],
                [field]: fieldValue,
            },
        };
        setSchedule(newSchedule);
        onChange(newSchedule);
    };

    const copyToWeekdays = () => {
        const mondayConfig = schedule["lunes"];
        const newSchedule = { ...schedule };

        ["martes", "miercoles", "jueves", "viernes"].forEach(day => {
            newSchedule[day] = { ...mondayConfig };
        });

        setSchedule(newSchedule);
        onChange(newSchedule);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Horario de Atención</label>
                <button
                    type="button"
                    onClick={copyToWeekdays}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    title="Copiar horario de Lunes a Vie"
                >
                    <Copy className="w-3 h-3" />
                    Copiar Lun a Vie
                </button>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
                {DAYS.map((day) => {
                    const config = schedule[day.key] || DEFAULT_DAY;

                    return (
                        <div key={day.key} className="p-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 w-32">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={config.abierto}
                                        onChange={(e) => handleDayChange(day.key, "abierto", e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <span className={`text-sm font-medium ${config.abierto ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {day.label}
                                </span>
                            </div>

                            {config.abierto ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={config.horaApertura}
                                        onChange={(e) => handleDayChange(day.key, "horaApertura", e.target.value)}
                                        className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                                    />
                                    <span className="text-slate-400">-</span>
                                    <input
                                        type="time"
                                        value={config.horaCierre}
                                        onChange={(e) => handleDayChange(day.key, "horaCierre", e.target.value)}
                                        className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                                    />
                                </div>
                            ) : (
                                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                    Cerrado
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
