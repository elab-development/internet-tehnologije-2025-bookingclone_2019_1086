import type { HostMessage } from "../hooks/useHostApartments";

type Props = {
  message: HostMessage | null;
};

function getMessageClassName(message: HostMessage) {
  if (message.type === "success") {
    return "alert alert-success";
  }

  return "alert alert-danger";
}

export default function HostApartmentsMessage({ message }: Props) {
  if (!message) {
    return null;
  }

  return (
    <div className={getMessageClassName(message)} role="alert">
      {message.text}
    </div>
  );
}