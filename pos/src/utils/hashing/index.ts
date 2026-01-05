import bcrypt from "bcryptjs";

export const forwardHashing = async (password: string) => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT as string, 10);
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const reversedHashing = async (
  inputPassword: string,
  dbSavedPassword: string
) => {
  const isPasswordMatch = await bcrypt.compare(inputPassword, dbSavedPassword);
  return isPasswordMatch;
};
