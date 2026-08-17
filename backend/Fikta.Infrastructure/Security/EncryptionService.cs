using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Fikta.Application.Common.Interfaces;

namespace Fikta.Infrastructure.Security;

public class EncryptionService : IEncryptionService
{
    private readonly byte[] _key;
    private static readonly byte[] DefaultIv = new byte[16] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76, 0x20, 0x49, 0x56 }; // 16 bytes IV

    public EncryptionService(IConfiguration configuration)
    {
        var keyString = configuration["EncryptionSettings:Key"] ?? "fikta_default_encryption_key_2026_!!!";
        using var sha256 = SHA256.Create();
        _key = sha256.ComputeHash(Encoding.UTF8.GetBytes(keyString));
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return string.Empty;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = DefaultIv;

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return string.Empty;

        try
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = DefaultIv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(Convert.FromBase64String(cipherText));
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);
            
            return sr.ReadToEnd();
        }
        catch (Exception)
        {
            return string.Empty;
        }
    }
}
