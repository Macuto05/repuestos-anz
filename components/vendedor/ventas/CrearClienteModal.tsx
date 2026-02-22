"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { UserPlus, Loader2 } from "lucide-react";
import { obtenerOCrearPerfilCliente } from "@/lib/actions-ventas";
import { toast } from "sonner";

interface CrearClienteModalProps {
    onClienteCreado: (cliente: any) => void;
}

export function CrearClienteModal({ onClienteCreado }: CrearClienteModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        nombre: "",
        cedula: "",
        telefono: "",
        email: "",
        direccion: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre || !formData.cedula) {
            toast.error("Nombre y Cédula son obligatorios");
            return;
        }

        startTransition(async () => {
            const resultado = await obtenerOCrearPerfilCliente({
                nombre: formData.nombre,
                cedula: formData.cedula,
                telefono: formData.telefono,
                email: formData.email
            });

            if (resultado.success) {
                toast.success("Cliente registrado correctamente");
                onClienteCreado({
                    id: resultado.data.id,
                    nombre: resultado.data.usuario.nombre,
                    cedula: resultado.data.usuario.cedula
                });
                setOpen(false);
                setFormData({ nombre: "", cedula: "", telefono: "", email: "", direccion: "" });
            } else {
                toast.error(resultado.error || "Error al registrar cliente");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <UserPlus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="nombre">Nombre Completo *</Label>
                        <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cedula">Cédula/RIF *</Label>
                            <Input
                                id="cedula"
                                value={formData.cedula}
                                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                                placeholder="V-12345678"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                                id="telefono"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                placeholder="0414-1234567"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email (Opcional)</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="cliente@ejemplo.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="direccion">Dirección (Opcional)</Label>
                        <Input
                            id="direccion"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            placeholder="Dirección fiscal o de entrega"
                        />
                    </div>
                    <Button type="submit" disabled={isPending} className="mt-2 bg-slate-900 text-white hover:bg-slate-800">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cliente
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
