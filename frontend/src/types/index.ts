export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageMeta {
  key: string;
  name: string;
  size?: number;
  lastModified?: string;
}

export interface ImageWithUrl extends ImageMeta {
  url: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
}
