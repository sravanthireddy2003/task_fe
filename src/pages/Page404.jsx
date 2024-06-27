import { Dialog } from "@headlessui/react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <Dialog.Title as="h2" className="text-4xl font-bold text-center text-gray-800">
          404
        </Dialog.Title>
        <Dialog.Description className="text-lg text-center text-gray-600 mt-4">
          Page Not Found
        </Dialog.Description>
        <p className="text-center text-gray-500 mt-2">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
