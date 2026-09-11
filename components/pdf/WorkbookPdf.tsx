import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Book, Field } from "@/lib/types";
import { answerToText, isFilled, plain } from "@/lib/answers-format";
import type { FontSet } from "@/lib/pdf-fonts";

/**
 * The reader's filled workbook, as a branded PDF.
 * Palette matches the printed book: deep green, goldenrod, ember, sienna, cream.
 */

const C = {
  green: "#042D1D",
  ember: "#E86100",
  gold: "#DCA424",
  sienna: "#7E3209",
  ink: "#241E17",
  muted: "#6E6558",
  cream: "#FBF7EF",
  rule: "#E4D8C3",
};

type Answers = Record<string, Record<number, unknown>>;

export function WorkbookPdf({
  book,
  answers,
  fonts,
  owner,
  filledOnly,
}: {
  book: Book;
  answers: Answers;
  fonts: FontSet;
  owner?: string | null;
  filledOnly: boolean;
}) {
  const s = styles(fonts);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const parts = book.parts
    .map((p) => ({
      ...p,
      sections: p.sections.filter((sec) =>
        filledOnly
          ? sec.fields.some((f, i) => isFilled(f, answers[sec.num]?.[i] as never))
          : true
      ),
    }))
    .filter((p) => p.sections.length > 0);

  let answered = 0;
  let total = 0;
  book.parts.forEach((p) =>
    p.sections.forEach((sec) =>
      sec.fields.forEach((f, i) => {
        total++;
        if (isFilled(f, answers[sec.num]?.[i] as never)) answered++;
      })
    )
  );
  const pct = total ? Math.round((answered / total) * 100) : 0;

  return (
    <Document
      title="Maintaining the Brand — My Brand Book"
      author={owner || "Maintaining the Brand"}
      subject="A completed brand identity workbook"
    >
      {/* Cover */}
      <Page size="LETTER" style={s.cover}>
        <View style={s.coverInner}>
          <Text style={s.coverEyebrow}>A BRAND WORKBOOK</Text>
          <Text style={s.coverTitle}>Maintaining{"\n"}the Brand</Text>
          <View style={s.coverBar} />
          {owner ? <Text style={s.coverOwner}>{owner}</Text> : null}
          <Text style={s.coverMeta}>
            {answered} of {total} fields complete · {pct}%
          </Text>
          <Text style={s.coverMeta}>{today}</Text>
        </View>
        <Text style={s.coverFoot}>An Urban Jungle Goddess product</Text>
      </Page>

      {/* Body */}
      <Page size="LETTER" style={s.page}>
        {parts.map((p) => (
          <View key={p.num}>
            <View style={s.partHead} wrap={false}>
              <Text style={s.partNum}>PART {p.num}</Text>
              <Text style={s.partName}>{p.name}</Text>
              {p.blurb ? <Text style={s.partBlurb}>{plain(p.blurb)}</Text> : null}
            </View>

            {p.sections.map((sec) => (
              <View key={sec.num} style={s.section}>
                <View wrap={false}>
                  <Text style={s.secTitle}>
                    <Text style={s.secNum}>{sec.num} </Text>
                    {sec.title}
                  </Text>
                  {sec.tag ? <Text style={s.secTag}>{plain(sec.tag)}</Text> : null}
                </View>

                {sec.fields.map((f, i) => (
                  <AnswerBlock
                    key={`${sec.num}-${i}`}
                    s={s}
                    field={f}
                    value={answers[sec.num]?.[i]}
                  />
                ))}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

function AnswerBlock({
  s,
  field,
  value,
}: {
  s: ReturnType<typeof styles>;
  field: Field;
  value: unknown;
}) {
  const filled = isFilled(field, value as never);
  const text = filled ? answerToText(field, value as never) : "";

  return (
    <View style={s.block} wrap={false}>
      {field.label ? <Text style={s.label}>{plain(field.label)}</Text> : null}
      {filled ? (
        <Text style={s.answer}>{text}</Text>
      ) : (
        <View style={s.blankBox}>
          <Text style={s.blank}>—</Text>
        </View>
      )}
    </View>
  );
}

function styles(f: FontSet) {
  return StyleSheet.create({
    cover: {
      backgroundColor: C.green,
      color: C.cream,
      paddingVertical: 90,
      paddingHorizontal: 64,
      justifyContent: "space-between",
    },
    coverInner: { marginTop: 80 },
    coverEyebrow: {
      fontFamily: f.body,
      fontSize: 9,
      letterSpacing: 3,
      color: C.gold,
      marginBottom: 18,
    },
    coverTitle: { fontFamily: f.display, fontSize: 46, lineHeight: 1.08, color: "#F6F1E7" },
    coverBar: { height: 3, width: 90, backgroundColor: C.gold, marginTop: 26, marginBottom: 26 },
    coverOwner: { fontFamily: f.display, fontSize: 17, color: "#F6F1E7", marginBottom: 10 },
    coverMeta: { fontFamily: f.body, fontSize: 10, color: "#C9BEAA", marginBottom: 3 },
    coverFoot: { fontFamily: f.body, fontSize: 8.5, color: "#8E836F", letterSpacing: 1 },

    page: {
      backgroundColor: "#FFFFFF",
      color: C.ink,
      paddingVertical: 56,
      paddingHorizontal: 62,
    },

    partHead: { marginTop: 22, marginBottom: 14, borderBottomWidth: 2, borderBottomColor: C.gold, paddingBottom: 8 },
    partNum: { fontFamily: f.body, fontSize: 8.5, letterSpacing: 2.2, color: C.sienna, marginBottom: 5 },
    partName: { fontFamily: f.display, fontSize: 23, color: C.green },
    partBlurb: { fontFamily: f.body, fontSize: 9.5, color: C.muted, marginTop: 5, lineHeight: 1.5 },

    section: { marginTop: 16, marginBottom: 4 },
    secTitle: { fontFamily: f.display, fontSize: 14, color: C.ink, marginBottom: 2 },
    secNum: { color: C.ember },
    secTag: { fontFamily: f.body, fontSize: 9, color: C.muted, marginBottom: 6, lineHeight: 1.45 },

    block: { marginTop: 9 },
    label: { fontFamily: f.body, fontSize: 9, fontWeight: 600, color: C.sienna, marginBottom: 3 },
    answer: {
      fontFamily: f.body,
      fontSize: 10.5,
      lineHeight: 1.55,
      color: C.ink,
      borderLeftWidth: 2,
      borderLeftColor: C.gold,
      paddingLeft: 9,
      paddingVertical: 2,
    },
    blankBox: { borderBottomWidth: 0.75, borderBottomColor: C.rule, paddingBottom: 7 },
    blank: { fontFamily: f.body, fontSize: 10, color: "#B8AC98" },
  });
}
