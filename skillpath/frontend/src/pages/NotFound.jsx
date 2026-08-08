import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <div className="font-display text-3xl mb-3">Off the map</div>
      <p className="text-muted mb-6">That page doesn't exist in this constellation.</p>
      <Link to="/" className="btn-primary">
        Back to Overview
      </Link>
    </div>
  );
}
