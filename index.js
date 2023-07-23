import fs from "fs";

const translations = new Map();

const old = fs.readFileSync("./old.po", "utf8");
const template = fs.readFileSync("./template.po", "utf8");

let txt = "";
old.split("\n").forEach((line) => {
	const [key, ...v] = line.split(" ");
	if (v.length) {
		const value = v.join(" ");
		switch (key) {
			case "msgctxt":
				txt = value;
				break;
			case "msgstr":
				if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value)) {
					translations.set(txt, value);
				}
				break;
		}
	}
});

let id = "";
let flagged = false;

const newFile = Buffer.from(
	template
		.split("\n")
		.map((line) => {
			if (line.startsWith("# unmodified strings")) {
				flagged = false;
			} else if (line.startsWith("# modified strings")) {
				flagged = true;
			}
			const [key, ...v] = line.split(" ");
			if (v.length) {
				const value = v.join(" ");
				switch (key) {
					case "msgctxt":
						txt = value;
						break;
					case "msgid":
						id = value;
						break;
					case "msgstr":
                        if(flagged && translations.has(txt)) {
                            console.log(`문자열 ${txt}(이)가 수정되어 번역 수정이 필요합니다.\n수정된 영문: ${id}\n번역: ${translations.get(txt)}\n\n`)
                        }
						return flagged
							? `msgstr ${id}`
							: `msgstr ${translations.get(txt) ?? id}`;
				}
			}
			return line;
		})
		.join("\n")
);

fs.writeFileSync("./new.po", newFile);
