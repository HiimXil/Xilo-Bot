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
};

export type Configuration = {
  GuildId: string;
  QuizChannelId: string;
  CurrentQuestion: String | null;
  CurrentAnswer: String | null;
  Answered: boolean;
};
