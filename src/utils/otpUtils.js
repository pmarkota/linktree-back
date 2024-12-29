const db = require("../db");

const generateOTP = () => {
  // For now, generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const saveOTP = async (phoneNumber, otpCode) => {
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // Delete any existing OTP for this phone number
    await client.query(
      "DELETE FROM otp_verifications WHERE phone_number = $1",
      [phoneNumber]
    );

    // Insert new OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    await client.query(
      "INSERT INTO otp_verifications (phone_number, otp_code, expires_at) VALUES ($1, $2, $3)",
      [phoneNumber, otpCode, expiresAt]
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving OTP:", error);
    return false;
  } finally {
    client.release();
  }
};

const verifyOTP = async (phoneNumber, otpCode) => {
  // For testing purposes, always return true
  return true;

  /* Real implementation will be:
  const client = await db.pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM otp_verifications WHERE phone_number = $1 AND otp_code = $2 AND expires_at > NOW() AND is_used = false',
      [phoneNumber, otpCode]
    );

    if (result.rows.length > 0) {
      // Mark OTP as used
      await client.query(
        'UPDATE otp_verifications SET is_used = true WHERE phone_number = $1 AND otp_code = $2',
        [phoneNumber, otpCode]
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  } finally {
    client.release();
  }
  */
};

module.exports = {
  generateOTP,
  saveOTP,
  verifyOTP,
};
