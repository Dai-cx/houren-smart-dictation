export function SpringBackground() {
  return (
    <div className="spring-scene" aria-hidden="true">
      {/* 天空 */}
      <div className="sky" />

      {/* 太阳 */}
      <div className="sun">
        <div className="sun-core" />
        <div className="sun-ray r1" />
        <div className="sun-ray r2" />
        <div className="sun-ray r3" />
        <div className="sun-ray r4" />
        <div className="sun-ray r5" />
        <div className="sun-ray r6" />
        <div className="sun-ray r7" />
        <div className="sun-ray r8" />
      </div>

      {/* 白云 */}
      <div className="cloud cloud-1">
        <div className="cloud-bump b1" />
        <div className="cloud-bump b2" />
        <div className="cloud-bump b3" />
        <div className="cloud-base" />
      </div>
      <div className="cloud cloud-2">
        <div className="cloud-bump b1" />
        <div className="cloud-bump b2" />
        <div className="cloud-bump b3" />
        <div className="cloud-base" />
      </div>
      <div className="cloud cloud-3">
        <div className="cloud-bump b1" />
        <div className="cloud-bump b2" />
        <div className="cloud-bump b3" />
        <div className="cloud-base" />
      </div>

      {/* 小鸟 */}
      <div className="bird bird-1">&#x1F424;</div>
      <div className="bird bird-2">&#x1F424;</div>

      {/* 风筝 */}
      <div className="kite-group">
        <svg className="kite-line" viewBox="0 0 200 300" width="200" height="300">
          <path
            d="M100,40 Q110,100 90,160 Q80,200 100,260"
            stroke="#888"
            strokeWidth="1"
            fill="none"
            strokeDasharray="4,3"
          />
        </svg>
        <div className="kite">
          <div className="kite-body" />
          <div className="kite-tail">
            <span className="tail-bow b1" />
            <span className="tail-bow b2" />
            <span className="tail-bow b3" />
            <span className="tail-bow b4" />
          </div>
        </div>
      </div>

      {/* 放风筝的小孩 */}
      <div className="child">
        <div className="child-head" />
        <div className="child-body" />
        <div className="child-arm left" />
        <div className="child-arm right" />
        <div className="child-leg left" />
        <div className="child-leg right" />
        <div className="child-hat" />
      </div>

      {/* 大树 */}
      <div className="tree tree-left">
        <div className="tree-trunk" />
        <div className="tree-crown c1" />
        <div className="tree-crown c2" />
        <div className="tree-crown c3" />
      </div>
      <div className="tree tree-right">
        <div className="tree-trunk" />
        <div className="tree-crown c1" />
        <div className="tree-crown c2" />
        <div className="tree-crown c3" />
      </div>

      {/* 灌木 */}
      <div className="bush bush-1" />
      <div className="bush bush-2" />
      <div className="bush bush-3" />

      {/* 花朵 */}
      {[
        { x: 8, y: 82, color: "#ff6b8a", size: 10 },
        { x: 15, y: 78, color: "#ffd54f", size: 8 },
        { x: 22, y: 84, color: "#ff6b8a", size: 11 },
        { x: 30, y: 80, color: "#ff8a65", size: 9 },
        { x: 45, y: 83, color: "#e57373", size: 10 },
        { x: 55, y: 79, color: "#ffd54f", size: 8 },
        { x: 65, y: 85, color: "#ff6b8a", size: 12 },
        { x: 72, y: 81, color: "#ff8a65", size: 9 },
        { x: 80, y: 83, color: "#e57373", size: 10 },
        { x: 88, y: 79, color: "#ffd54f", size: 8 },
        { x: 92, y: 84, color: "#ff6b8a", size: 11 },
        { x: 96, y: 80, color: "#ff8a65", size: 9 },
      ].map((f, i) => (
        <div
          key={i}
          className="flower"
          style={{
            left: `${f.x}%`,
            bottom: `${100 - f.y}%`,
          }}
        >
          <span
            className="flower-petal"
            style={{ width: f.size, height: f.size, background: f.color }}
          />
          <span className="flower-center" />
        </div>
      ))}

      {/* 草地 */}
      <div className="grass" />
    </div>
  );
}
