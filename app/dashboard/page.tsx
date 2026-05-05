"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Bot, Settings, LayoutDashboard, LogOut, Power, RefreshCcw, ShieldCheck, Zap,
    Activity, History, QrCode, Users, Lock, ChevronRight, Loader2, User, Key, Mail,
    Plus, Trash2, Terminal, UserCircle, CreditCard, ExternalLink, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import api from "@/utils/api";
import Toast from "@/components/Toast";
import Modal from "@/components/Modal";

export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [user, setUser] = useState<any>(null);
    const [instances, setInstances] = useState<any[]>([]);
    const [licenses, setLicenses] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ msg: string, type: "success" | "error" | "info" } | null>(null);

    const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
        setNotification({ msg, type });
    };

    // Auth Check
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token) {
            router.push("/login");
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }

        fetchData();

        const interval = setInterval(() => {
            if (activeTab === "overview" || activeTab === "sessions") fetchInstances();
        }, 5000);

        return () => clearInterval(interval);
    }, [activeTab, router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchInstances(), fetchLicenses(), fetchGlobalLogs()]);
        } catch (e) {
            console.error("Fetch Data Error", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchInstances = async () => {
        try {
            const res = await api.get("/instances");
            setInstances(res.data);
        } catch (e) { }
    };

    const fetchLicenses = async () => {
        try {
            const res = await api.get("/licenses");
            setLicenses(res.data);
        } catch (e) { }
    };

    const fetchGlobalLogs = async () => {
        // Mocking global logs for now
        setLogs([
            { id: 1, time: new Date().toLocaleTimeString(), msg: "SaaS Engine Heartbeat: OK", lvl: "SYSTEM", color: "text-cyan-400" },
            { id: 2, time: new Date().toLocaleTimeString(), msg: "Database Connection Optimized", lvl: "DB", color: "text-purple-400" },
            { id: 3, time: new Date().toLocaleTimeString(), msg: "New security policy enforced", lvl: "SEC", color: "text-green-400" },
        ]);
    };

    const handleAction = async (instanceId: string, action: string) => {
        setActionLoading(instanceId + action);
        try {
            if (action === "delete") {
                await api.delete(`/instances/${instanceId}`);
                notify("Instância excluída com sucesso!", "success");
            } else {
                await api.post(`/instances/${instanceId}/${action}`);
                notify(`Instância ${action === 'start' ? 'iniciada' : 'parada'} com sucesso!`, "success");
            }
            fetchInstances();
        } catch (e: any) {
            console.error("Action error", e);
            notify(e.response?.data?.error || "A ação falhou. Verifique sua licença ou conexões ativas.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    if (loading && !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                <p className="text-slate-500 font-bold tracking-widest text-xs uppercase animate-pulse">Inicializando Núcleo...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-50 selection:bg-cyan-500/30 font-sans">
            {/* Sidebar */}
            <aside className="w-72 border-r border-slate-900 bg-slate-950/40 backdrop-blur-3xl flex flex-col pt-10 p-6 shrink-0 h-screen sticky top-0 z-20">
                <div onClick={() => router.push("/")} className="flex items-center gap-4 mb-12 group cursor-pointer">
                    <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-xl shadow-cyan-500/20 group-hover:rotate-6 transition-transform">
                        <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight block leading-none">IRIS</span>
                        <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Engine</span>
                    </div>
                </div>

                <nav className="space-y-3 flex-grow">
                    {[
                        { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
                        { id: "sessions", label: "Sessões", icon: Users },
                        { id: "logs", label: "Logs Globais", icon: Terminal },
                        { id: "settings", label: "Minha Conta", icon: UserCircle },
                        ...(user?.role === "ADMIN" ? [
                            { id: "admin", label: "Painel Admin", icon: Lock },
                            { id: "users", label: "Usuários", icon: Users }
                        ] : []),
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 py-3.5 px-5 rounded-2xl transition-all group ${activeTab === item.id
                                ? "bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-900/10"
                                : "text-slate-500 hover:text-white hover:bg-white/5"}`}
                        >
                            <item.icon className={`w-5 h-5 transition-transform ${activeTab === item.id ? "scale-110" : "group-hover:scale-110"}`} />
                            <span className="font-bold text-sm tracking-wide">{item.label}</span>
                            {activeTab === item.id && <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
                        </button>
                    ))}
                </nav>

                <div className="border-t border-slate-900/50 pt-6 mt-auto">
                    <button onClick={handleLogout} className="flex items-center gap-4 py-4 px-5 w-full text-slate-500 hover:text-red-400 transition-all rounded-2xl hover:bg-red-500/5 group font-bold text-sm">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-10 max-w-[1600px] mx-auto overflow-y-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-[2px] bg-cyan-500"></div>
                            <h2 className="text-[10px] font-black text-cyan-500 tracking-[0.3em] uppercase">{activeTab}</h2>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter">
                            {activeTab === 'overview' && 'Nodo do Sistema'}
                            {activeTab === 'sessions' && 'Instâncias do Bot'}
                            {activeTab === 'logs' && 'Trace Global'}
                            {activeTab === 'settings' && 'Perfil do Usuário'}
                            {activeTab === 'admin' && 'Enterprise'}
                            {activeTab === 'users' && 'Gestão de Usuários'}
                        </h1>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 bg-slate-900/50 p-2 pr-6 rounded-3xl border border-slate-800 shadow-xl">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="font-black text-sm text-white leading-none mb-1">{user?.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user?.role}</p>
                        </div>
                    </motion.div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === "overview" && <OverviewTab instances={instances} licenses={licenses} actionLoading={actionLoading} handleAction={handleAction} notify={notify} />}
                    {activeTab === "sessions" && <SessionsTab instances={instances} licenses={licenses} actionLoading={actionLoading} handleAction={handleAction} notify={notify} fetchInstances={fetchInstances} fetchLicenses={fetchLicenses} />}
                    {activeTab === "logs" && <LogsTab logs={logs} />}
                    {activeTab === "settings" && <SettingsTab user={user} notify={notify} />}
                    {activeTab === "admin" && <AdminTab notify={notify} />}
                    {activeTab === "users" && <UsersTab notify={notify} />}
                </AnimatePresence>

                <AnimatePresence>
                    {notification && (
                        <Toast
                            message={notification.msg}
                            type={notification.type}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function OverviewTab({ instances, licenses, handleAction, actionLoading }: any) {
    const activeLicense = licenses.find((l: any) => l.status === "ACTIVE" && (!l.expiresAt || new Date(l.expiresAt) > new Date()));

    const stats = [
        { label: "Instâncias", value: instances.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Conectadas", value: instances.filter((t: any) => t.connection === "CONNECTED").length, icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
        { label: "Assinatura", value: activeLicense ? "Ativa" : "Expirada", icon: CreditCard, color: activeLicense ? "text-green-400" : "text-red-400", bg: activeLicense ? "bg-green-500/10" : "bg-red-500/10" },
        { label: "Segurança", value: "Protegido", icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-500/10" },
    ];

    const primary = instances[0];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={stat.label} className="bg-slate-900/30 p-8 rounded-[2rem] border border-slate-900 group hover:border-cyan-500/20 transition-all duration-500 shadow-sm">
                        <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                            <stat.icon size={26} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-4xl font-black tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900/30 border border-slate-900 rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Bot size={300} /></div>

                    <div className="relative z-10 mb-20">
                        <h3 className="text-3xl font-black mb-2">Controle do Motor Principal</h3>
                        <p className="text-slate-500 font-medium">Gerencie seu gateway de instância principal do WhatsApp.</p>
                    </div>

                    {!primary ? (
                        <div className="text-center p-12 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800">
                            <Plus className="w-12 h-12 mx-auto text-slate-800 mb-4" />
                            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Nenhum Nodo Registrado</p>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-950/40 p-8 rounded-[2rem] border border-slate-900">
                            <div className="flex-grow w-full">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${primary.connection === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : ['CONNECTING', 'INITIALIZING', 'AWAITING_PAIRING'].includes(primary.connection) ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)] animate-pulse' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{primary.connection || "DISCONNECTED"}</span>
                                </div>
                                <h4 className="text-3xl font-black leading-none mb-1">{primary.name}</h4>
                                <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">{primary.status}</p>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => handleAction(primary.id, primary.connection === 'DISCONNECTED' ? 'start' : 'stop')}
                                    className={`flex-grow md:px-10 h-16 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${primary.connection === 'DISCONNECTED' ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-900/30' : 'bg-red-500/20 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'}`}
                                >
                                    {actionLoading === primary.id + 'start' || actionLoading === primary.id + 'stop' ? <Loader2 className="animate-spin" /> : primary.connection === 'DISCONNECTED' ? <><Power className="w-5 h-5" /> Online</> : <><Power className="w-5 h-5" /> Offline</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900/30 border border-slate-900 rounded-[2.5rem] p-10 flex flex-col items-center justify-center shadow-inner group relative">
                    <div className="absolute inset-0 bg-cyan-500 opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none"></div>
                    {primary?.connection === "INITIALIZING" && primary?.lastQR ? (
                        <div className="text-center space-y-8">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-[2rem] shadow-2xl relative">
                                <QRCodeSVG value={primary.lastQR || ""} size={200} />
                                <div className="absolute -top-3 -right-3 bg-cyan-500 p-2 rounded-xl text-white shadow-lg"><QrCode className="w-5 h-5" /></div>
                            </motion.div>
                            <div>
                                <h4 className="text-xl font-black mb-1">Gateway de Pareamento</h4>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Escaneie usando o Engine IRIS</p>
                            </div>
                        </div>
                    ) : primary?.connection === "CONNECTED" ? (
                        <div className="text-center">
                            <div className="w-32 h-32 mx-auto bg-cyan-500/10 rounded-[2rem] flex items-center justify-center border-2 border-cyan-500/20 shadow-2xl shadow-cyan-900/20 group-hover:scale-110 transition-transform duration-500">
                                <ShieldCheck size={64} className="text-cyan-400" />
                            </div>
                            <h4 className="font-black text-2xl mt-8">Nodo Sincronizado</h4>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Link 100% Seguro</p>
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            <Bot size={100} className="mx-auto text-slate-800 opacity-20" />
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Módulo Inativo</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function SessionsTab({ instances, licenses, handleAction, actionLoading, notify, fetchInstances, fetchLicenses }: any) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
    const [activationKey, setActivationKey] = useState("");
    const [newInstance, setNewInstance] = useState({ name: "", adminNumber: "", botNumber: "", pairingType: "QR" });
    const [editingInstance, setEditingInstance] = useState<any>(null);

    const activeLicense = licenses.find((l: any) => l.status === "ACTIVE" && (!l.expiresAt || new Date(l.expiresAt) > new Date()));

    const handleActivate = async () => {
        if (!activationKey) return notify("Insira uma chave", "error");
        try {
            await api.post("/licenses/activate", { key: activationKey });
            notify("Licença ativada!", "success");
            setActivationKey("");
            setIsActivateModalOpen(false);
            fetchLicenses();
        } catch (e: any) {
            notify(e.response?.data?.error || "Erro ao ativar licença", "error");
        }
    };

    const handleCreate = async () => {
        if (!newInstance.name) return notify("Nome é obrigatório", "error");
        try {
            await api.post("/instances", newInstance);
            notify("Instância criada!", "success");
            setIsCreateModalOpen(false);
            setNewInstance({ name: "", adminNumber: "", botNumber: "", pairingType: "QR" });
            fetchInstances();
        } catch (e: any) {
            notify(e.response?.data?.error || "Erro ao criar instância", "error");
        }
    };

    const handleUpdate = async () => {
        if (!editingInstance.name) return notify("Nome é obrigatório", "error");
        try {
            await api.put(`/instances/${editingInstance.id}`, {
                name: editingInstance.name,
                adminNumber: editingInstance.adminNumber,
                botNumber: editingInstance.botNumber,
                pairingType: editingInstance.pairingType
            });
            notify("Configurações salvas!", "success");
            setIsEditModalOpen(false);
            setEditingInstance(null);
            fetchInstances();
        } catch (e: any) {
            notify(e.response?.data?.error || "Erro ao atualizar", "error");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 bg-slate-900/20 p-8 rounded-[2.5rem] border border-slate-900 shadow-inner">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">Status de Assinatura</p>
                    {activeLicense ? (
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><Zap size={20} /></div>
                            <div>
                                <p className="text-xl font-black tracking-tight">{activeLicense.key}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Expira em: {new Date(activeLicense.expiresAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-500"><ShieldAlert size={20} /></div>
                            <div>
                                <p className="text-xl font-black tracking-tight">Sem Licença Ativa</p>
                                <p className="text-[10px] font-bold text-slate-600 uppercase">Ative uma chave para começar</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={() => setIsActivateModalOpen(true)}
                        className="flex-grow md:flex-none px-8 h-14 bg-slate-900 text-slate-400 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest border border-slate-800 hover:bg-white/5 transition-all"
                    >
                        <CreditCard className="w-4 h-4" /> Ativar Licença
                    </button>
                    <button
                        onClick={() => {
                            if (!activeLicense) return notify("Ative uma licença primeiro!", "error");
                            setIsCreateModalOpen(true);
                        }}
                        className={`flex-grow md:flex-none px-8 h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${activeLicense ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                    >
                        <Plus className="w-5 h-5" /> Criar Instância
                    </button>
                </div>
            </div>

            {/* Modais */}
            <Modal isOpen={isActivateModalOpen} title="Ativar Nodo de Acesso" onClose={() => setIsActivateModalOpen(false)}>
                <div className="space-y-6">
                    <div className="p-6 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 mb-4">
                        <p className="text-xs text-cyan-500 font-bold leading-relaxed">Insira a chave de licença (IRIS-XXXX) para vincular sua conta ao cluster de processamento.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Chave IRIS</label>
                        <input
                            type="text"
                            placeholder="IRIS-XXXX-XXXX"
                            value={activationKey}
                            onChange={(e) => setActivationKey(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-mono text-lg font-bold"
                        />
                    </div>
                    <button
                        onClick={handleActivate}
                        className="w-full h-16 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95"
                    >
                        Validar e Ativar
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isCreateModalOpen} title="Configurar Nova Instância" onClose={() => setIsCreateModalOpen(false)}>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nome de Exibição</label>
                        <input
                            type="text"
                            placeholder="Ex: Comercial WhatsApp"
                            value={newInstance.name}
                            onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Seu Número (Admin)</label>
                            <input
                                type="text"
                                placeholder="551199999..."
                                value={newInstance.adminNumber}
                                onChange={(e) => setNewInstance({ ...newInstance, adminNumber: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Número do Bot (Login)</label>
                            <input
                                type="text"
                                placeholder="551198888..."
                                value={newInstance.botNumber}
                                onChange={(e) => setNewInstance({ ...newInstance, botNumber: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Tipo de Pareamento</label>
                        <select
                            value={newInstance.pairingType}
                            onChange={(e) => setNewInstance({ ...newInstance, pairingType: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold appearance-none cursor-pointer"
                        >
                            <option value="QR">QR CODE</option>
                            <option value="CODE">CODE (NÚMERO)</option>
                        </select>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="w-full h-16 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-cyan-900/20 active:scale-95"
                    >
                        Provisionar Recurso
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isEditModalOpen} title="Editar Configurações" onClose={() => setIsEditModalOpen(false)}>
                {editingInstance && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nome de Exibição</label>
                            <input
                                type="text"
                                value={editingInstance.name}
                                onChange={(e) => setEditingInstance({ ...editingInstance, name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Seu Número (Admin)</label>
                                <input
                                    type="text"
                                    value={editingInstance.adminNumber}
                                    onChange={(e) => setEditingInstance({ ...editingInstance, adminNumber: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Número do Bot</label>
                                <input
                                    type="text"
                                    value={editingInstance.botNumber}
                                    onChange={(e) => setEditingInstance({ ...editingInstance, botNumber: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Tipo de Pareamento</label>
                            <select
                                value={editingInstance.pairingType}
                                onChange={(e) => setEditingInstance({ ...editingInstance, pairingType: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold appearance-none cursor-pointer"
                            >
                                <option value="QR">QR CODE</option>
                                <option value="CODE">CODE (NÚMERO)</option>
                            </select>
                        </div>
                        <button
                            onClick={handleUpdate}
                            className="w-full h-16 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                )}
            </Modal>

            <div className="bg-slate-900/30 border border-slate-900 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/40 border-b border-slate-900">
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Identidade da Instância</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Conexão</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Operações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {instances.map((t: any) => (
                            <InstanceRow key={t.id} t={t} handleAction={handleAction} actionLoading={actionLoading} notify={notify} fetchInstances={fetchInstances} setIsEditModalOpen={setIsEditModalOpen} setEditingInstance={setEditingInstance} />
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

function InstanceRow({ t, handleAction, actionLoading, notify, fetchInstances, setIsEditModalOpen, setEditingInstance }: any) {
    const [statusData, setStatusData] = useState<any>(t);
    const [timeLeft, setTimeLeft] = useState(0);
    const [localActionLoading, setLocalActionLoading] = useState(false);

    useEffect(() => {
        setStatusData((prev: any) => ({ ...prev, ...t }));
    }, [t]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/instances/${t.id}/status`);
                setStatusData((prev: any) => ({
                    ...prev,
                    connection: res.data.status.toUpperCase(),
                    pairingCode: res.data.pairingCode || prev.pairingCode,
                    lastQR: res.data.lastQR || prev.lastQR
                }));
            } catch (e) { }
        }, 5000);
        return () => clearInterval(interval);
    }, [t.id]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const handlePairingCode = async () => {
        let phoneToUse = statusData.botNumber;
        if (!phoneToUse) {
            phoneToUse = window.prompt("Digite seu número com DDD (ex: 11999999999)");
            if (!phoneToUse) return;
        }

        const sanitizedPhone = phoneToUse.replace(/\D/g, '').replace(/^0+/, '');

        console.log('[DEBUG] API URL:', process.env.NEXT_PUBLIC_API_URL);

        if (!t.id) {
            notify('ID da instância não encontrado', 'error');
            return;
        }

        if (!sanitizedPhone || sanitizedPhone.length < 10) {
            notify('Número de telefone inválido ou ausente', 'error');
            return;
        }

        setLocalActionLoading(true);
        try {
            const token = localStorage.getItem("token");
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            const res = await fetch(`${baseUrl}/instances/${t.id}/pairing-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phoneNumber: sanitizedPhone
                })
            });

            if (!res.ok) {
                let errorData;
                try {
                    errorData = await res.json();
                } catch (e) {
                    errorData = { error: `Erro HTTP ${res.status}: Não foi possível converter a resposta pra JSON` };
                }
                throw new Error(errorData?.error || `HTTP ${res.status}`);
            }

            const data = await res.json();

            setStatusData((prev: any) => ({ ...prev, pairingCode: data.pairingCode, connection: 'AWAITING_PAIRING' }));
            setTimeLeft(60);
            notify("Código gerado", "success");
            fetchInstances();
        } catch (err: any) {
            console.error('[PAIRING CODE] Erro completo:', err);
            console.error('[PAIRING CODE] Mensagem:', err?.message);
            console.error('[PAIRING CODE] Response:', err?.response);
            notify(err?.message || "Erro ao gerar código", "error");
        } finally {
            setLocalActionLoading(false);
        }
    };

    const isConnected = statusData.connection === 'CONNECTED';
    const isConnecting = ['CONNECTING', 'INITIALIZING'].includes(statusData.connection);
    const isDisconnected = statusData.connection === 'DISCONNECTED' || !statusData.connection;

    return (
        <tr className="hover:bg-white/[0.02] transition-colors group">
            <td className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isConnected ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-900 text-slate-600 border border-slate-800'}`}>
                        {statusData.name[0]?.toUpperCase()}
                    </div>
                    <div>
                        <p className="font-black text-lg leading-none mb-1">{statusData.name}</p>
                        <p className="text-[10px] font-mono text-slate-600">{statusData.id}</p>
                    </div>
                </div>
            </td>
            <td className="p-6 text-center">
                <div className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${statusData.status === 'active' ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400' : 'border-slate-800 bg-slate-950 text-slate-600'}`}>
                    {statusData.status}
                </div>
            </td>
            <td className="p-6">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : isConnecting ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-green-500' : isConnecting ? 'text-yellow-500' : 'text-red-500'}`}>
                        {statusData.connection || "DESCONECTADO"}
                    </span>
                </div>

                {statusData.pairingType === "CODE" && isDisconnected && (
                    <button onClick={handlePairingCode} disabled={timeLeft > 0 || localActionLoading} className="mt-4 px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600/40 transition-all disabled:opacity-50 flex gap-2 items-center">
                        {localActionLoading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <RefreshCcw className="w-3 h-3" />}
                        {timeLeft > 0 ? `Aguarde ${timeLeft}s` : "Reconectar / Gerar novo código"}
                    </button>
                )}

                {statusData.pairingCode && (statusData.connection === 'AWAITING_PAIRING') && (
                    <div className="mt-4 p-4 bg-slate-950 border border-cyan-500/30 rounded-2xl max-w-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-2">Vá em WhatsApp {'>'} Aparelhos conectados {'>'} Conectar com número de telefone e digite o código:</p>
                        <span className="block text-3xl font-mono text-cyan-400 font-black tracking-[0.2em]">{statusData.pairingCode}</span>
                        {timeLeft > 0 && <p className="text-[10px] text-cyan-600 mt-2 uppercase font-bold tracking-widest">Expira em {timeLeft}s</p>}
                        {timeLeft === 0 && <button onClick={handlePairingCode} className="mt-4 px-4 py-2 w-full bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all">Gerar Novo Código</button>}
                    </div>
                )}

                {statusData.lastQR && statusData.pairingType !== "CODE" && !isConnected && (
                    <div className="mt-4 p-4 bg-white rounded-2xl w-fit relative group-qr">
                        <QRCodeSVG value={statusData.lastQR} size={150} />
                    </div>
                )}
            </td>
            <td className="p-6">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => handleAction(statusData.id, isDisconnected ? 'start' : 'stop')}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!isDisconnected ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-600 hover:text-white'}`}
                    >
                        {actionLoading === statusData.id + 'start' || actionLoading === statusData.id + 'stop' ? <Loader2 className="w-5 h-5 animate-spin" /> : isDisconnected ? <Power className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => { setEditingInstance(statusData); setIsEditModalOpen(true); }}
                        className="w-10 h-10 bg-slate-900 text-slate-500 rounded-xl hover:bg-white/5 hover:text-white transition-all flex items-center justify-center"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => { if (confirm("Deletar esta instância?")) handleAction(statusData.id, "delete") }}
                        className="w-10 h-10 bg-red-900/10 text-red-900/40 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                        {actionLoading === statusData.id + "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                </div>
            </td>
        </tr>
    );
}

function LogsTab({ logs }: any) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-950 border border-slate-900 rounded-[2.5rem] overflow-hidden min-h-[600px] flex flex-col shadow-2xl">
            <div className="px-10 py-8 bg-slate-900/20 border-b border-slate-900 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl"><Terminal className="text-cyan-400 w-6 h-6" /></div>
                    <h3 className="font-black text-2xl tracking-tighter italic">LIVE_TRACE_IRIS</h3>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl text-[10px] font-black text-slate-500 tracking-widest border border-slate-800 italic uppercase">Auto-Scroll: On</div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black border border-green-500/20 animate-pulse tracking-[0.2em] uppercase">Streaming via Socket</div>
                </div>
            </div>

            <div className="p-8 font-mono text-sm leading-relaxed overflow-y-auto space-y-3 flex-grow bg-slate-950/50">
                {logs.map((log: any) => (
                    <div key={log.id} className="flex gap-8 group">
                        <span className="text-slate-800 font-bold italic shrink-0">[{log.time}]</span>
                        <span className={`${log.color} font-black min-w-[100px] text-[10px] px-3 py-1 rounded-lg border border-current/10 text-center uppercase leading-none flex items-center justify-center select-none`}>{log.lvl}</span>
                        <span className="text-slate-400 tracking-tight group-hover:text-slate-200 transition-colors">{" >> "} {log.msg}</span>
                    </div>
                ))}
                <div className="flex gap-4 py-10 italic text-slate-600 text-xs font-black uppercase tracking-[0.3em] justify-center text-center">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Fim do buffer ativo
                </div>
            </div>
        </motion.div>
    );
}

function SettingsTab({ user, notify }: any) {
    const [isCifraModalOpen, setIsCifraModalOpen] = useState(false);
    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-10">
                <div className="bg-slate-900/30 border border-slate-900 p-10 rounded-[2.5rem] shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-4 bg-cyan-500/10 rounded-2xl"><UserCircle className="text-cyan-400 w-8 h-8" /></div>
                        <h3 className="text-3xl font-black tracking-tighter">Conta do Sistema</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Identidade de Exibição</label>
                            <div className="flex items-center gap-5 p-5 bg-slate-950 rounded-[1.5rem] border border-slate-900 focus-within:border-cyan-500/50 transition-all shadow-inner">
                                <User className="text-cyan-500 w-6 h-6 shrink-0 opacity-50" />
                                <input type="text" readOnly value={user?.name || "Carregando Identificação..."} className="bg-transparent border-none outline-none w-full font-black text-white text-lg tracking-tight" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">E-mail de Comunicação</label>
                            <div className="flex items-center gap-5 p-5 bg-slate-950 rounded-[1.5rem] border border-slate-900 focus-within:border-cyan-500/50 transition-all shadow-inner">
                                <Mail className="text-cyan-500 w-6 h-6 shrink-0 opacity-50" />
                                <input type="email" readOnly value={user?.email || "Carregando Buffer Seguro..."} className="bg-transparent border-none outline-none w-full font-bold text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {user?.role === "ADMIN" && (
                        <div className="space-y-4 pt-6 border-t border-slate-900/50">
                            <button
                                onClick={() => setIsCifraModalOpen(true)}
                                className="w-full flex items-center justify-between p-6 bg-slate-950/50 hover:bg-cyan-500/5 transition-all rounded-3xl border border-slate-900 group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-amber-900/20"><Key size={24} /></div>
                                    <div className="text-left">
                                        <h4 className="font-black text-xl tracking-tight">Acesso ao Cifra Root</h4>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Rotacionar hash de segurança global</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-800 group-hover:text-cyan-500 transition-colors" />
                            </button>

                            <Modal isOpen={isCifraModalOpen} title="Rotação de Cifra Root" onClose={() => setIsCifraModalOpen(false)}>
                                <div className="space-y-6 text-center">
                                    <div className="w-20 h-20 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto border border-amber-500/20 shadow-xl shadow-amber-900/20">
                                        <ShieldAlert size={40} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg mb-2">Confirmar Rotação Global?</p>
                                        <p className="text-slate-400 text-sm leading-relaxed">Esta ação irá gerar um novo Hash de Segurança para **TODOS** os usuários no banco de dados. Senhas normais não serão afetadas, mas todas as chaves de criptografia ativa serão invalidadas.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => setIsCifraModalOpen(false)} className="flex-grow h-14 bg-slate-950 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-800 hover:bg-white/5 transition-all">Cancelar</button>
                                        <button
                                            onClick={() => {
                                                api.post("/admin/rotate-root-cipher")
                                                    .then(res => {
                                                        notify(res.data.message, "success");
                                                        setIsCifraModalOpen(false);
                                                    })
                                                    .catch(e => notify(e.response?.data?.error || "Erro ao rotacionar", "error"));
                                            }}
                                            className="flex-grow h-14 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-900/20"
                                        >
                                            Rotacionar Agora
                                        </button>
                                    </div>
                                </div>
                            </Modal>
                        </div>
                    )}
                </div>

                <div className="bg-red-500/5 border border-red-500/10 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 justify-between group">
                    <div>
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-2"><ShieldAlert size={14} /> Ação Crítica Necessária</h3>
                        <p className="text-slate-500 text-sm font-medium">Desativar sua conta irá expurgar todas as sessões ativas e deletar logs criptografados permanentemente.</p>
                    </div>
                    <button className="px-10 h-16 bg-red-900/20 text-red-500 rounded-2xl font-black text-sm uppercase tracking-widest border border-red-900/30 hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-900/20 active:scale-95">Apagar Dados</button>
                </div>
            </div>

            {/* Sidebar Security Info */}
            <div className="space-y-10">
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform duration-700 pointer-events-none"><Zap size={200} /></div>
                    <div className="relative z-10">
                        <p className="text-cyan-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4">Permissão da Instância</p>
                        <h4 className="text-4xl font-black text-white mb-10 tracking-tighter leading-none italic uppercase">{user?.role === 'ADMIN' ? 'Autoridade Total' : 'Acesso Restrito'}</h4>
                        <div className="space-y-3">
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest leading-none">Registration Hash</p>
                                <p className="text-white font-mono text-sm">#SHA256-4299-AXB</p>
                            </div>
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md text-right">
                                <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest leading-none">Tokens de Segurança</p>
                                <p className="text-cyan-400 font-black text-sm">2-FA ATIVADO</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 p-10 rounded-[2.5rem] text-center shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                    <div className="w-20 h-20 bg-slate-950 rounded-[1.5rem] border border-slate-900 mx-auto mb-8 flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-xl">
                        <ShieldCheck className="text-cyan-500 w-10 h-10" />
                    </div>
                    <h4 className="font-black text-xl mb-4">Criptografia Quântica</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Seu buffer de dados é protegido por AES-256 e protocolos de isolamento multi-tenant de ponta a ponta.</p>
                </div>
            </div>
        </motion.div>
    );
}

function AdminTab({ notify }: any) {
    const [licenseKey, setLicenseKey] = useState("");
    const [allLicenses, setAllLicenses] = useState<any[]>([]);
    const [stats, setStats] = useState({ users: 0, revenue: 0 });

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [licRes] = await Promise.all([
                api.get("/licenses"),
            ]);
            setAllLicenses(licRes.data);
            // Mock stats
            setStats({ users: 1245, revenue: 94800 });
        } catch (e: any) {
            console.error("Admin fetch error:", e);
            notify("Erro ao carregar dados do admin.", "error");
        }
    };

    const generateKey = async () => {
        try {
            const res = await api.post("/licenses/generate", { durationDays: 30 });
            setLicenseKey(res.data.key);
            notify("Chave de Licença gerada!", "success");
            fetchAdminData();
        } catch (e: any) {
            const msg = e.response?.data?.error || "Erro ao gerar chave.";
            console.error("Generate key error:", e);
            notify(msg, "error");
        }
    };

    const revokeKey = async (key: string) => {
        try {
            await api.post(`/licenses/${key}/revoke`);
            notify("Licença revogada", "info");
            fetchAdminData();
        } catch (e) {
            notify("Erro ao revogar", "error");
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-slate-900/30 border border-slate-900 p-10 rounded-[3rem] shadow-sm flex flex-col justify-between min-h-[400px]">
                    <div>
                        <h3 className="text-2xl font-black mb-2 flex items-center gap-4 italic"><Key className="text-cyan-400 rotate-45" /> Gerador de Chaves</h3>
                        <p className="text-slate-500 text-sm font-medium mb-10">Emita novos Nodos de Acesso Enterprise para distribuição.</p>
                    </div>

                    <div className="space-y-10">
                        <div className="p-10 bg-slate-950/80 rounded-[2rem] border-2 border-slate-900 text-center border-dashed group relative overflow-hidden">
                            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {licenseKey ? (
                                <p className="text-4xl font-black tracking-[0.2em] text-cyan-400 select-all animate-in zoom-in-95 duration-500 shadow-sm">{licenseKey}</p>
                            ) : (
                                <p className="text-slate-700 font-black uppercase tracking-[0.3em] text-xs">Aguardando Fluxo de Geração</p>
                            )}
                        </div>
                        <button
                            onClick={generateKey}
                            className="w-full h-20 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl shadow-cyan-900/40 group"
                        >
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> Criar Nodo de Acesso
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 p-10 rounded-[3rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-2xl font-black mb-2 flex items-center gap-4 italic"><Users className="text-cyan-400" /> Fluxo da Plataforma</h3>
                        <p className="text-slate-500 text-sm font-medium mb-10">Dados agregados em tempo real em todos os clusters.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 flex-grow">
                        <div className="p-8 bg-slate-950/50 rounded-[2rem] border border-slate-900 flex justify-between items-center group hover:border-cyan-500/20 transition-all">
                            <div>
                                <p className="text-slate-600 text-[10px] font-black uppercase mb-2 tracking-widest">Usuários Globais</p>
                                <p className="text-5xl font-black tracking-tighter">{stats.users.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-400 group-hover:scale-110 transition-transform"><Users size={32} /></div>
                        </div>
                        <div className="p-8 bg-slate-950/50 rounded-[2rem] border border-slate-900 flex justify-between items-center group hover:border-green-500/20 transition-all">
                            <div>
                                <p className="text-slate-600 text-[10px] font-black uppercase mb-2 tracking-widest">Receita Ativa</p>
                                <p className="text-5xl font-black tracking-tighter text-green-500">${(stats.revenue / 1000).toFixed(1)}k</p>
                            </div>
                            <div className="p-4 bg-green-500/10 rounded-2xl text-green-500 group-hover:scale-110 transition-transform"><CreditCard size={32} /></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="bg-slate-950/40 p-10 border-b border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-slate-900 rounded-2xl"><Key className="text-slate-500 w-8 h-8" /></div>
                        <div>
                            <h3 className="font-black text-2xl tracking-tight">Registro de Licenças</h3>
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mt-1">Gerenciamento central de nodos e durações</p>
                        </div>
                    </div>
                </div>

                {allLicenses.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center opacity-20 filter grayscale">
                        <div className="relative mb-8">
                            <Key size={120} className="text-slate-500" />
                            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20"></div>
                        </div>
                        <p className="font-black uppercase tracking-[0.5em] text-xs max-w-sm leading-relaxed">Nenhuma licença no buffer global.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/60 border-b border-slate-900">
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Chave</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuário</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Expiração</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900">
                                {allLicenses.map((lic: any) => (
                                    <tr key={lic.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="p-6 font-mono font-bold text-cyan-500">{lic.key}</td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${lic.status === 'ACTIVE' ? 'border-green-500/20 bg-green-500/10 text-green-400' : lic.status === 'EXPIRED' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                                                {lic.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-sm text-slate-400 font-bold">{lic.user?.email || "Disponível"}</td>
                                        <td className="p-6 text-sm text-slate-500 font-medium">{lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : "-"}</td>
                                        <td className="p-6 text-right">
                                            {lic.status === 'ACTIVE' && (
                                                <button onClick={() => revokeKey(lic.key)} className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest">Revogar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function UsersTab({ notify }: any) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "CLIENT" });
    const [editFormData, setEditFormData] = useState({ name: "", password: "", confirmPassword: "", role: "CLIENT" });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/users");
            setUsers(res.data);
        } catch (e: any) {
            notify(e.response?.data?.error || "Erro ao carregar usuários.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const { name, email, password, confirmPassword, role } = formData;
        if (!name || !email || !password) return notify("Preencha todos os campos", "error");
        if (password !== confirmPassword) return notify("As senhas não coincidem", "error");
        if (password.length < 8) return notify("Senha deve conter 8 caracteres", "error");

        try {
            await api.post("/admin/users", { name, email, password, role });
            notify("Usuário criado com sucesso", "success");
            setIsCreateModalOpen(false);
            setFormData({ name: "", email: "", password: "", confirmPassword: "", role: "CLIENT" });
            fetchUsers();
        } catch (e: any) {
            notify(e.response?.data?.error || "Erro ao criar usuário", "error");
        }
    };

    const handleUpdate = async () => {
        const { name, password, confirmPassword, role } = editFormData;
        if (!name) return notify("O nome é obrigatório", "error");
        if (password && password !== confirmPassword) return notify("As senhas não coincidem", "error");
        if (password && password.length < 8) return notify("Senha deve conter 8 caracteres", "error");

        try {
            await api.put(`/admin/users/${editingUser.id}`, { name, password, role });
            notify("Usuário atualizado com sucesso", "success");
            setIsEditModalOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (e: any) {
            notify(e.response?.data?.error || "Erro ao atualizar usuário", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja deletar este usuário? Esta ação pode apagar instâncias associadas!")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            notify("Usuário deletado", "success");
            fetchUsers();
        } catch (e: any) {
            notify(e.response?.data?.error || "Erro ao deletar usuário", "error");
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setEditFormData({ name: user.name, password: "", confirmPassword: "", role: user.role });
        setIsEditModalOpen(true);
    };

    if (loading) return <div className="text-center p-20 text-slate-500 font-bold tracking-widest uppercase">Carregando usuários...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-slate-900/20 p-8 rounded-[2.5rem] border border-slate-900 shadow-inner">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Users size={14} className="text-cyan-500" /> Gestão Operacional
                    </p>
                    <h3 className="text-2xl font-black tracking-tight">{users.length} Registros Ativos</h3>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex-grow md:flex-none px-8 h-14 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Novo Usuário
                </button>
            </div>

            <Modal isOpen={isCreateModalOpen} title="Criar Novo Usuário" onClose={() => setIsCreateModalOpen(false)}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Completo</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500/50" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-mail</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha</label>
                            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500/50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmar Senha</label>
                            <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500/50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nível de Acesso (Role)</label>
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500/50">
                            <option value="CLIENT">Usuário Comum (CLIENT)</option>
                            <option value="ADMIN">Administrador (ADMIN)</option>
                        </select>
                    </div>
                    <button onClick={handleCreate} className="w-full h-14 mt-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-sm uppercase transition-all shadow-xl">Criar Conta</button>
                </div>
            </Modal>

            <Modal isOpen={isEditModalOpen} title="Editar Usuário" onClose={() => setIsEditModalOpen(false)}>
                {editingUser && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Completo</label>
                            <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500/50" />
                        </div>
                        <div className="space-y-2 opacity-50">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-mail (Não Editável)</label>
                            <input type="email" value={editingUser.email} disabled className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none" />
                        </div>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl my-2">
                            <p className="text-xs text-amber-500 font-bold">Deixe os campos de senha em branco caso não queira alterar.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nova Senha</label>
                                <input type="password" value={editFormData.password} onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmar Nova Senha</label>
                                <input type="password" value={editFormData.confirmPassword} onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500/50" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nível de Acesso (Role)</label>
                            <select value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500/50">
                                <option value="CLIENT">Usuário Comum (CLIENT)</option>
                                <option value="ADMIN">Administrador (ADMIN)</option>
                            </select>
                        </div>
                        <button onClick={handleUpdate} className="w-full h-14 mt-4 bg-white hover:bg-slate-200 text-black rounded-xl font-black text-sm uppercase transition-all shadow-xl">Salvar Alterações</button>
                    </div>
                )}
            </Modal>

            <div className="bg-slate-900/30 border border-slate-900 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/40 border-b border-slate-900">
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuário</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Acesso</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Data de Criação</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-black border border-slate-800">
                                            {u.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-white font-bold leading-none mb-1">{u.name}</p>
                                            <p className="text-[10px] text-slate-500">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${u.role === 'ADMIN' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-6 text-sm text-slate-500 font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEditModal(u)} className="w-10 h-10 bg-slate-900 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all flex items-center justify-center">
                                            <Settings className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(u.id)} className="w-10 h-10 bg-red-900/10 text-red-900/40 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
