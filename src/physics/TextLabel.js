export class TextLabel {
  constructor(x, y, text = 'Notiz', options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.text = text;
    this.fontSize = options.fontSize || 14;
    this.color = options.color || '#94a3b8';
    this.width = options.width || Math.max(60, this.text.length * (this.fontSize * 0.65) + 16);
    this.height = options.height || (this.fontSize + 12);
  }

  getBounds() {
    const w = Math.max(50, this.width || (this.text.length * (this.fontSize * 0.65) + 16));
    const h = Math.max(20, this.height || (this.fontSize + 12));
    return {
      left: this.x,
      top: this.y,
      right: this.x + w,
      bottom: this.y + h,
      width: w,
      height: h
    };
  }

  contains(px, py) {
    const b = this.getBounds();
    return px >= b.left && px <= b.right && py >= b.top && py <= b.bottom;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      text: this.text,
      fontSize: this.fontSize,
      color: this.color,
      width: this.width,
      height: this.height
    };
  }

  static fromJSON(data) {
    return new TextLabel(data.x, data.y, data.text, data);
  }
}
