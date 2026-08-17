from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VIDEO_DIR = ROOT / "docs" / "video"
ASSETS = VIDEO_DIR / "assets"
SCENES = VIDEO_DIR / "scenes"
TOOLS = ROOT / ".tmp-video-tools"
sys.path.insert(0, str(TOOLS))

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont  # noqa: E402
import imageio_ffmpeg  # noqa: E402

WIDTH, HEIGHT = 1080, 1350
BG = "#07110d"
SURFACE = "#12231b"
SURFACE_2 = "#0b1823"
INK = "#f4f7f2"
MUTED = "#9aa8a0"
GREEN = "#c7ff63"
LINE = "#26372e"

FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
FONT_REGULAR = Path("C:/Windows/Fonts/arial.ttf")
FONT_MONO = Path("C:/Windows/Fonts/consola.ttf")


def font(size: int, *, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_MONO if mono else FONT_BOLD if bold else FONT_REGULAR
    return ImageFont.truetype(str(path), size=size)


def background() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    for x in range(0, WIDTH, 72):
        draw.line((x, 0, x, HEIGHT), fill="#102019", width=1)
    for y in range(0, HEIGHT, 72):
        draw.line((0, y, WIDTH, y), fill="#102019", width=1)
    draw.ellipse((700, -240, 1260, 320), fill="#0d2017")
    return image


def rounded_paste(canvas: Image.Image, content: Image.Image, box: tuple[int, int, int, int], radius: int = 20) -> None:
    x1, y1, x2, y2 = box
    content = content.resize((x2 - x1, y2 - y1), Image.Resampling.LANCZOS)
    mask = Image.new("L", content.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *content.size), radius=radius, fill=255)
    canvas.paste(content, (x1, y1), mask)
    ImageDraw.Draw(canvas).rounded_rectangle(box, radius=radius, outline=LINE, width=2)


def brand(draw: ImageDraw.ImageDraw) -> None:
    draw.rounded_rectangle((58, 48, 112, 102), radius=4, fill=GREEN)
    draw.text((73, 66), "DH", font=font(17, bold=True, mono=True), fill="#10180f")
    draw.text((130, 48), "DevHub", font=font(30, bold=True), fill=INK)
    draw.text((132, 82), "BUILD · FOCUS · SHIP", font=font(13, mono=True), fill=GREEN)


def header(canvas: Image.Image, step: str, title: str, subtitle: str) -> None:
    draw = ImageDraw.Draw(canvas)
    brand(draw)
    draw.rounded_rectangle((820, 54, 1018, 94), radius=20, outline=LINE, fill=SURFACE)
    draw.text((850, 66), step, font=font(13, bold=True, mono=True), fill=GREEN)
    draw.text((58, 150), title, font=font(58, bold=True), fill=INK)
    draw.text((60, 222), subtitle, font=font(24), fill=MUTED)


def footer_note(canvas: Image.Image, label: str, value: str) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((58, 1015, 1022, 1225), radius=20, fill=SURFACE_2, outline=LINE, width=2)
    draw.text((90, 1052), label.upper(), font=font(15, bold=True, mono=True), fill=GREEN)
    draw.text((90, 1092), value, font=font(32, bold=True), fill=INK)
    draw.text((90, 1162), "Todo el contexto queda en un solo lugar.", font=font(20), fill=MUTED)


def screenshot_scene(filename: str, step: str, title: str, subtitle: str, note_label: str, note_value: str, output: str) -> None:
    canvas = background()
    header(canvas, step, title, subtitle)
    shot = Image.open(ASSETS / filename).convert("RGB")
    rounded_paste(canvas, shot, (58, 300, 1022, 902))
    footer_note(canvas, note_label, note_value)
    canvas.save(SCENES / output, quality=94)


def focus_scene() -> None:
    canvas = background()
    header(canvas, "04 · FOCUS", "Entrá en modo Focus", "Una sesión concreta. Sin perder el contexto.")
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((58, 302, 1022, 1075), radius=24, fill=SURFACE, outline=LINE, width=2)
    draw.text((98, 348), "PORTFOLIO 2026", font=font(16, bold=True, mono=True), fill=GREEN)
    draw.text((98, 386), "Publicar la nueva sección de casos", font=font(28, bold=True), fill=INK)
    center = (540, 690)
    draw.ellipse((center[0] - 205, center[1] - 205, center[0] + 205, center[1] + 205), outline="#21352a", width=28)
    draw.arc((center[0] - 205, center[1] - 205, center[0] + 205, center[1] + 205), -90, 212, fill=GREEN, width=28)
    draw.text((center[0], center[1] - 52), "25:00", anchor="mm", font=font(78, bold=True, mono=True), fill=INK)
    draw.text((center[0], center[1] + 38), "SESIÓN EN CURSO", anchor="mm", font=font(15, bold=True, mono=True), fill=GREEN)
    draw.rounded_rectangle((310, 955, 770, 1025), radius=8, fill=GREEN)
    draw.text((540, 990), "MANTENER EL FOCO", anchor="mm", font=font(18, bold=True), fill="#10180f")
    draw.text((58, 1142), "TRABAJÁ CON INTENCIÓN", font=font(15, bold=True, mono=True), fill=GREEN)
    draw.text((58, 1182), "El tiempo, la tarea y el objetivo viajan juntos.", font=font(28, bold=True), fill=INK)
    canvas.save(SCENES / "05-focus.png", quality=94)


def intro_scene() -> None:
    shot = Image.open(ASSETS / "01-home.png").convert("RGB")
    bg = shot.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(6))
    bg = ImageEnhance.Brightness(bg).enhance(0.23)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (3, 10, 7, 128))
    canvas = Image.alpha_composite(bg.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(canvas)
    brand(draw)
    draw.text((58, 335), "DE UNA IDEA", font=font(24, bold=True, mono=True), fill=GREEN)
    draw.text((58, 390), "a un avance\nreal.", font=font(92, bold=True), fill=INK, spacing=2)
    draw.text((60, 625), "Organizá. Enfocate. Mostrá el proceso.", font=font(28), fill=MUTED)
    draw.rounded_rectangle((58, 1030, 560, 1110), radius=8, fill=GREEN)
    draw.text((309, 1070), "DEVHUB EN 50 SEGUNDOS", anchor="mm", font=font(17, bold=True), fill="#10180f")
    canvas.save(SCENES / "00-intro.png", quality=94)


def outro_scene() -> None:
    canvas = background()
    draw = ImageDraw.Draw(canvas)
    logo = Image.open(ROOT / "public" / "pwa-512.png").convert("RGBA").resize((150, 150), Image.Resampling.LANCZOS)
    canvas.paste(logo, (465, 185), logo)
    draw.text((540, 400), "DevHub", anchor="mm", font=font(66, bold=True), fill=INK)
    draw.text((540, 478), "BUILD · FOCUS · SHIP", anchor="mm", font=font(18, bold=True, mono=True), fill=GREEN)
    draw.text((540, 620), "Tus ideas merecen\nllegar a producción.", anchor="mm", align="center", font=font(52, bold=True), fill=INK, spacing=12)
    draw.rounded_rectangle((130, 860, 950, 950), radius=10, fill=GREEN)
    draw.text((540, 905), "PROBÁ LA DEMO INTERACTIVA", anchor="mm", font=font(21, bold=True), fill="#10180f")
    draw.text((540, 1015), "dev-project-hub.vercel.app/demo", anchor="mm", font=font(22, mono=True), fill=MUTED)
    draw.text((540, 1190), "Organizá el trabajo. Conservá el contexto. Mostrá el resultado.", anchor="mm", font=font(18), fill=INK)
    canvas.save(SCENES / "07-outro.png", quality=94)


def render_video() -> None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    scene_files = [
        "00-intro.png",
        "01-idea.png",
        "02-project.png",
        "03-tasks.png",
        "05-focus.png",
        "06-result.png",
        "07-outro.png",
    ]
    durations = [5.0, 7.0, 7.0, 7.0, 9.0, 8.0, 7.0]
    command = [ffmpeg, "-y"]
    for scene, duration in zip(scene_files, durations):
        command.extend(["-framerate", "30", "-loop", "1", "-t", str(duration), "-i", str(SCENES / scene)])

    filters: list[str] = []
    for index, duration in enumerate(durations):
        filters.append(
            f"[{index}:v]scale={WIDTH}:{HEIGHT},"
            f"zoompan=z='min(zoom+0.00012,1.018)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={WIDTH}x{HEIGHT}:fps=30,"
            f"fade=t=in:st=0:d=0.4,fade=t=out:st={duration - 0.4}:d=0.4,setpts=PTS-STARTPTS[v{index}]"
        )
    filters.append("".join(f"[v{i}]" for i in range(len(scene_files))) + f"concat=n={len(scene_files)}:v=1:a=0[outv]")
    command.extend([
        "-filter_complex", ";".join(filters),
        "-map", "[outv]",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-r", "30",
        str(VIDEO_DIR / "devhub-product-demo-50s.mp4"),
    ])
    subprocess.run(command, check=True)


def main() -> None:
    SCENES.mkdir(parents=True, exist_ok=True)
    intro_scene()
    screenshot_scene("02-ideas.png", "01 · IDEA", "Capturá lo que aparece", "Evaluá la idea antes de que se pierda.", "UNA IDEA CLARA", "Release Notes visuales", "01-idea.png")
    screenshot_scene("03-projects.png", "02 · PROYECTO", "Convertí intención en proyecto", "Stack, estado y progreso siempre visibles.", "PROYECTO ACTIVO", "Portfolio 2026 · 72%", "02-project.png")
    screenshot_scene("04-tasks.png", "03 · TAREAS", "Definí el próximo paso", "Priorizá acciones pequeñas y concretas.", "SIGUIENTE ACCIÓN", "Publicar la nueva sección de casos", "03-tasks.png")
    focus_scene()
    screenshot_scene("06-result.png", "05 · RESULTADO", "Cerrá el ciclo", "Guardá el avance y dejá listo lo que sigue.", "AVANCE REGISTRADO", "2 de 4 tareas completadas", "06-result.png")
    outro_scene()
    render_video()
    Image.open(SCENES / "00-intro.png").save(VIDEO_DIR / "devhub-product-demo-cover.png", quality=94)


if __name__ == "__main__":
    main()
