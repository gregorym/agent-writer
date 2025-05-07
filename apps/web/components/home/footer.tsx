export default function Footer() {
  return (
    <div className="mt-48 w-full border-t">
      <div className="py-4 mx-auto text-center text-sm dark:text-gray-400">
        © {new Date().getFullYear()} Mars 6, LLC. All rights reserved.
      </div>
    </div>
  );
}
