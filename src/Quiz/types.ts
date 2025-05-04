export type User = {
  id: string;
  discordId: string;
  username: string;
  score: number;
  guildId: string;
};

export type Question = {
  id: number;
  text: string;
  answer: string;
  description: string;
  weight: number;
};

export type Configuration = {
  GuildId: string;
  QuizChannelId: string;
  QuizRoleId: string | null;
  CurrentQuestion: string | null;
  CurrentAnswer: string | null;
  Answered: boolean;
};
