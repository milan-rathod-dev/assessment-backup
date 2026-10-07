/** Animated skeleton row used while data is loading */
export function SkeletonRow({ cols = 7 }) {
  return (
    <tr>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} style={{ padding: '16px' }}>
          <div
            className="skeleton"
            style={{
              height: 14,
              width: i === 0 ? '70%' : i === cols - 1 ? '40%' : '80%',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

/** Multiple skeleton rows */
export function SkeletonTable({ rows = 6, cols = 7 }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}
