import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDominantColor } from '../utils/imageColors';

const AmbientBackground = ({ imageUrl }) => {
    const [colors, setColors] = useState({ current: 'rgba(5, 5, 8, 1)', next: null });
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        let active = true;

        const updateColor = async () => {
            if (!imageUrl) {
                // Return to default dark theme if no image
                setColors(prev => ({ current: prev.next || prev.current, next: null }));
                return;
            }

            try {
                const color = await getDominantColor(imageUrl);
                if (active && isMounted.current && color) {
                    setColors(prev => ({
                        current: prev.next || prev.current, // Lock previous transition state
                        next: color
                    }));
                }
            } catch (err) {
                console.warn("Failed to update ambient color", err);
            }
        };

        const timeout = setTimeout(updateColor, 200); // Debounce slightly
        return () => {
            active = false;
            clearTimeout(timeout);
        };
    }, [imageUrl]);

    // Cleanup transition (move next to current after animation) is implicit in CSS/motion 
    // but here we just render two layers for simple crossfade.
    // Actually, simply stacking AnimatePresence works best.

    // Better approach for smooth constantly changing background:
    // Maintain a 'displayColor' state.

    // Let's iterate using just one active motion div that animates to the new background?
    // No, standard crossfade needs 2 layers.

    // We will render the "current" color as a base, and the "next" color as an overlay that fades in.
    // Once faded in, it effectively becomes "current".

    // Simpler View:
    // Just map the `imageUrl` to a color and render a fixed full-screen gradient that animates `backgroundColor` or `background`.
    // motion.div handles color interpolation automatically!

    const [displayColor, setDisplayColor] = useState('rgba(124, 58, 237, 0.15)'); // Default purpleish glow

    useEffect(() => {
        if (!imageUrl) {
            setDisplayColor('rgba(124, 58, 237, 0.15)');
            return;
        }

        const fetchColor = async () => {
            const c = await getDominantColor(imageUrl);
            if (c) setDisplayColor(c.replace('rgb', 'rgba').replace(')', ', 0.3)')); // Add transparency
            else setDisplayColor('rgba(124, 58, 237, 0.15)');
        };

        // Debounce to avoid flashing on rapid hover
        const t = setTimeout(fetchColor, 100);
        return () => clearTimeout(t);
    }, [imageUrl]);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden text-clip">
            {/* Base Dark Background */}
            <div className="absolute inset-0 bg-[#050508]" />

            {/* Dynamic Glow */}
            <motion.div
                className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%]"
                animate={{
                    background: `radial-gradient(circle at 50% 50%, ${displayColor} 0%, rgba(5,5,8,0) 50%)`
                }}
                transition={{ duration: 1.5, ease: "linear" }}
                style={{ opacity: 0.6 }}
            />

            {/* Secondary subtle glow for depth (optional, maybe standard blue/purple) */}
            <div
                className="absolute top-0 right-0 w-full h-full opacity-20"
                style={{ background: 'radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.2) 0%, transparent 60%)' }}
            />
            <div
                className="absolute bottom-0 left-0 w-full h-full opacity-20"
                style={{ background: 'radial-gradient(circle at 20% 80%, rgba(6, 214, 160, 0.1) 0%, transparent 60%)' }}
            />

            {/* Noise/Texture Overlay (optional) */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};

export default AmbientBackground;
