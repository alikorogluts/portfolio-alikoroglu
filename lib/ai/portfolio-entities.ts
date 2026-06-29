export type PortfolioEntity = {
  canonical: string;
  aliases: string[];
  category: "project" | "technology" | "platform";
  doNotAutoCorrectTo?: string[];
};

export const PORTFOLIO_ENTITIES: PortfolioEntity[] = [
  {
    canonical: "DeepSecure",
    aliases: ["deepsecure", "deep secure", "deepsecur", "depsecur", "dep secure", "deepfake project", "ai vs real"],
    category: "project",
  },
  {
    canonical: "Habit Tracker",
    aliases: ["habit tracker", "habit", "alışkanlık takip", "aliskanlik takip"],
    category: "project",
  },
  {
    canonical: "Teknofest 2024",
    aliases: ["teknofest", "teknofest 2024", "rockfall", "kaya düşmesi", "kaya dusmesi"],
    category: "project",
  },
  {
    canonical: "Attendance Tracking System",
    aliases: ["attendance tracking", "attendance tracking system", "yoklama takip", "yoklama sistemi"],
    category: "project",
  },
  {
    canonical: "GRIT Corporate Website",
    aliases: ["grit", "grit corporate website", "grit sitesi", "kurumsal web sitesi"],
    category: "project",
  },
  { canonical: "Next.js", aliases: ["next.js", "nextjs", "next js", "nexjs"], category: "technology" },
  { canonical: "React", aliases: ["react", "reactjs", "react js"], category: "technology" },
  { canonical: "TypeScript", aliases: ["typescript", "type script", "ts"], category: "technology" },
  { canonical: "Prisma", aliases: ["prisma", "prismaa"], category: "technology" },
  { canonical: "PostgreSQL", aliases: ["postgresql", "postgres", "postgre sql", "postgre"], category: "technology" },
  { canonical: "Supabase", aliases: ["supabase", "supabse", "supa base"], category: "platform" },
  { canonical: "RabbitMQ", aliases: ["rabbitmq", "rabbit mq", "rabittmq", "rabbit"], category: "technology" },
  { canonical: "SignalR", aliases: ["signalr", "signal r", "signal"], category: "technology" },
  { canonical: "Flutter", aliases: ["flutter", "fluter"], category: "technology" },
  { canonical: "Python", aliases: ["python", "pyhton", "py"], category: "technology" },
  { canonical: "Qwen", aliases: ["qwen", "qwen3", "qwen 3"], category: "technology" },
  { canonical: "QLoRA", aliases: ["qlora", "q lora", "lora"], category: "technology" },
  { canonical: "Vercel", aliases: ["vercel", "vercelde", "vercel analytics", "speed insights"], category: "platform" },
  { canonical: "Docker", aliases: ["docker", "doker"], category: "technology" },
  { canonical: "GradCAM", aliases: ["gradcam", "grad cam"], category: "technology" },
  { canonical: "OpenCV", aliases: ["opencv", "open cv"], category: "technology" },
];
