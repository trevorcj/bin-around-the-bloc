import toast from "react-hot-toast";

export default function showToast(type, message) {
  const options = { duration: 4000 };

  if (type === "success") {
    return toast.success(message, options);
  }

  if (type === "error") {
    return toast.error(message, options);
  }

  return toast(message, options);
}
