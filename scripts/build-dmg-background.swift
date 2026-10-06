import AppKit

let root = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent().deletingLastPathComponent()
let output = root.appendingPathComponent("build/dmg")
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

func drawText(_ value: String, y: CGFloat, size: CGFloat, weight: NSFont.Weight, color: NSColor) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = .center
    (value as NSString).draw(in: NSRect(x: 32, y: y, width: 576, height: 40), withAttributes: [
        .font: NSFont.systemFont(ofSize: size, weight: weight),
        .foregroundColor: color,
        .paragraphStyle: paragraph
    ])
}

for scale in [1, 2] {
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 640 * scale, pixelsHigh: 420 * scale,
                                  bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                  colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    let cg = NSGraphicsContext(bitmapImageRep: bitmap)!.cgContext
    cg.translateBy(x: 0, y: CGFloat(420 * scale))
    cg.scaleBy(x: CGFloat(scale), y: -CGFloat(scale))
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: cg, flipped: true)

    NSColor(calibratedWhite: 0.97, alpha: 1).setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: 640, height: 420)).fill()
    let ink = NSColor(calibratedWhite: 0.12, alpha: 1)
    let muted = NSColor(calibratedWhite: 0.38, alpha: 1)
    drawText("DoTwo Teleprompter", y: 35, size: 27, weight: .semibold, color: ink)
    drawText("Arrastra la app a Aplicaciones", y: 80, size: 18, weight: .regular, color: muted)

    let arrow = NSBezierPath()
    arrow.move(to: NSPoint(x: 280, y: 202))
    arrow.line(to: NSPoint(x: 356, y: 202))
    arrow.move(to: NSPoint(x: 338, y: 184))
    arrow.line(to: NSPoint(x: 356, y: 202))
    arrow.line(to: NSPoint(x: 338, y: 220))
    arrow.lineWidth = 4
    arrow.lineCapStyle = .round
    arrow.lineJoinStyle = .round
    NSColor(calibratedRed: 0.12, green: 0.45, blue: 0.58, alpha: 1).setStroke()
    arrow.stroke()

    drawText("Cuando termine la copia, expulsa esta imagen.", y: 335, size: 14, weight: .regular, color: muted)
    drawText("Abre DoTwo Teleprompter desde Aplicaciones.", y: 360, size: 14, weight: .regular, color: muted)
    NSGraphicsContext.restoreGraphicsState()

    let filename = scale == 1 ? "background.png" : "background@2x.png"
    try bitmap.representation(using: .png, properties: [:])!.write(to: output.appendingPathComponent(filename))
}
