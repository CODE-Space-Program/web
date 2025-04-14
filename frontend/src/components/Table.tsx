import React from "react";

export const Table: React.FC<{
  data: React.ReactNode[][];
}> = ({ data }) => {
  return (
    <table
      className="data animate"
      style={{
        opacity: 1,
        visibility: "inherit",
        translate: "none",
        rotate: "none",
        scale: "none",
        transform: "translate3d(0px, 0px, 0px)",
      }}
    >
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
