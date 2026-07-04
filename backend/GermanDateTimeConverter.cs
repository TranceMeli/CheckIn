using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend
{

    public class GermanDateTimeConverter : JsonConverter<DateTime>
    {
        private static readonly CultureInfo DeCulture = CultureInfo.GetCultureInfo("de-DE");

        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return DateTime.Parse(reader.GetString() ?? string.Empty, DeCulture);    
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString("dd.MM.yyyy HH:mm:ss"));
        }
    }
}
