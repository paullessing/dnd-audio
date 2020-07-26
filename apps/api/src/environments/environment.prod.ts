import path from "path";

export const environment = {
  production: true,
  databaseDir: path.join(__dirname, '../../../db'),
  mediaDir: path.join(__dirname, '../../../media'),
};
