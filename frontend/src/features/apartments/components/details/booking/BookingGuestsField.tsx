import { useTranslation } from "react-i18next";

type Props = {
  guests: string;
  maxGuests: number;
  onGuestsChange: (value: string) => void;
};

export default function BookingGuestsField({
  guests,
  maxGuests,
  onGuestsChange,
}: Props) {
  const { t } = useTranslation();

  function handleGuestsChange(event: React.ChangeEvent<HTMLInputElement>) {
    onGuestsChange(event.target.value);
  }

  return (
    <div className="details-booking__field details-booking__field--full">
      <label className="details-booking__field-label">
        {t("apartments.details.booking.guests")}
      </label>

      <input
        type="number"
        min="1"
        max={maxGuests}
        value={guests}
        onChange={handleGuestsChange}
        className="details-booking__input"
        placeholder="2"
      />
    </div>
  );
}