type Props = {
  loading: boolean;
  error: string | null;
};

function renderLoading(loading: boolean) {
  if (!loading) {
    return null;
  }

  return <div>Loading...</div>;
}

function renderError(error: string | null) {
  if (!error) {
    return null;
  }

  return (
    <div className="alert alert-danger" role="alert">
      {error}
    </div>
  );
}

export default function HostApartmentsStatus({ loading, error }: Props) {
  return (
    <>
      {renderLoading(loading)}
      {renderError(error)}
    </>
  );
}