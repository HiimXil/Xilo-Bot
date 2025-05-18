export type User = {
  guildId: string;
  discordId: string;
  username: string | null;
  score: number;
};

export type Question = {
  id: number;
  text: string;
  answer: string;
  description: string;
};

export type Weight = {
  questionId: number;
  guildId: string;
  weight: number;
};

export type Configuration = {
  guildId: string;
  quizChannelId: string | null;
  quizRoleId: string | null;
  wordleCategoryId: string | null;
  wordleRoleId: string | null;
  wordleMessageId: string | null;
};

export type State = {
  guildId: string;
  currentQuestion: string | null;
  currentAnswer: string | null;
  answered: boolean;
};
