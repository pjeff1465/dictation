# import spacy
# from spacy.matcher import Matcher
# from word2number import w2n

# nlp = spacy.load("en_core_web_sm")

# matcher = Matcher(nlp.vocab)

# math_ops = {
#     "plus": "+",
#     "minus": "-",
#     "times": "*",
#     "divided": "/",
#     "over": "/",
#     "multiplies": "*",
#     "equals": "=",
#     "eqal": "="
# }

# pattern = [
#     {"POS": "NUM"},
#     {"LOWER": {"IN": list(math_ops.keys())}},
#     {"POS": "NUM"},
#     {"LOWER": {"IN": ["equals", "equal"]}, "OP": "?"},
#     {"POS": "NUM", "OP": "?"}
# ]

# matcher.add("MATH_PHRASE", [pattern])

# def process_math(text):
#     doc = nlp(text)
#     matches = matcher(doc)

#     if not matches:
#         return text
    
#     math_id, start, end = matches[0]
#     span = doc[start:end]
#     tokens = [token.text.lower() for token in span]

#     converted = []
#     for token in tokens:
#         if token in math_ops:
#             converted.append(math_ops[token])
#         else:
#             try:
#                 converted.append(str(w2n.word_to_num(token)))
#             except:
#                 converted.append(token)
#     return " ".join(converted)


