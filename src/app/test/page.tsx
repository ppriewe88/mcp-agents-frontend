"use client"

import { motion } from "motion/react"

export default function TestPage() {
  return (
    <>
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                width: 100,
                height: 100,
                backgroundColor: "#5686F5",
                borderRadius: "50%",
                marginTop: "20px"
            }}
        />
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.4,
                scale: { type: "spring", visualDuration: 0.4, bounce: 0.2 },
            }}
            className="chatMessage"
            style = {{
                backgroundColor: "#F55656", 
                color: "white", 
                padding: "10px", 
                marginTop: "20px"}}
        />
        <motion.div
            initial={{ opacity: 0, scale: 5 }}
            animate={{ opacity: 2, scale: 1, rotate: 360 }}
            style={{
                width: 100,
                height: 100,
                backgroundColor: "#5686F5",
                borderRadius: "10%",
                marginTop: "20px"
            }}
        />
        <motion.div
            initial={{ 
                scale: 0.5,
                transform: "translateY(-100px) translateX(-50px)"
             }}
            animate={{ 
                scale: 1, 
                transform: "translateY(0px) translateX(0px)"
             }}
             transition={{
                duration: 0.4,
            }}
            whileHover={{
                scale: 1.1,
                boxShadow: "0 8px 16px rgba(17, 24, 39, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            className="chatMessage"
            style={{
                // width: 100,
                // height: 100,
                backgroundColor: "#5bf556",
                borderRadius: "10%",
                boxShadow: "0 3px 6px rgba(17, 24, 39, 1)",
                marginTop: "20px"
            }}
        />
        <motion.div
            animate={{
                scale: [1, 2, 1],
                rotate: [0, 90, 180],
                borderRadius: ["0%", "0%", "50%"],
                // transform: ["translateY(50px) translateX(50px)", "translateY(-100px) translateX(100px)", "translateY(0px) translateX(0px)"]
            }}
            transition={{
                duration: 2,
                ease: "easeInOut",
                times: [0, 0.2, 0.5],
                repeat: 1,
                repeatDelay: 1,
            }}
            className="chatMessage"
            style={{
                backgroundColor: "#5686F5",
                borderRadius: "10%",
                boxShadow: "10px 10px 20px rgba(9, 10, 12, 1)",
                marginTop: "20px"
            }}
        />
    </>
    )
}