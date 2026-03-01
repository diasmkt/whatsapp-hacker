"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
    message: string;
    type: "success" | "error" | "info";
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle2 className="text-green-400 w-6 h-6" />,
        error: <AlertCircle className="text-red-400 w-6 h-6" />,
        info: <Info className="text-cyan-400 w-6 h-6" />,
    };

    const colors = {
        success: "border-green-500/20 bg-green-500/5 shadow-green-900/10",
        error: "border-red-500/20 bg-red-500/5 shadow-red-900/10",
        info: "border-cyan-500/20 bg-cyan-500/5 shadow-cyan-900/10",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] min-w-[350px] p-5 rounded-2xl border backdrop-blur-2xl flex items-center gap-4 shadow-2xl ${colors[type]}`}
        >
            <div className="shrink-0">{icons[type]}</div>
            <div className="flex-grow">
                <p className="text-white font-black text-sm tracking-tight leading-tight">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
            >
                <X size={18} />
            </button>
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-1 rounded-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-cyan-500'}`}
            />
        </motion.div>
    );
}
