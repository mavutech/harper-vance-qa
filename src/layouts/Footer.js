import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <div className="main-footer">
      <span>&copy; {year} Harper Vance Qualitative Analysis. All Rights Reserved.</span>
    </div>
  )
}