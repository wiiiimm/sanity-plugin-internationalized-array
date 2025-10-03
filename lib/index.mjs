import * as suspend from "suspend-react";
import { suspend as suspend$1 } from "suspend-react";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { isSanityDocument, useSchema, setIfMissing, insert, PatchEvent, useClient, useWorkspace, defineDocumentFieldAction, useFormValue, set, ArrayOfObjectsItem, MemberItemError, defineField, unset, isDocumentSchemaType, definePlugin, isObjectInputProps } from "sanity";
import { useLanguageFilterStudioContext } from "@sanity/language-filter";
import { Grid, Button, useToast, Stack, Box, Text, Card, Code, Spinner, Label, MenuButton, Menu, MenuItem, Flex, Tooltip } from "@sanity/ui";
import equal from "fast-deep-equal";
import { memo, useCallback, createContext, useContext, useDeferredValue, useMemo, useEffect, createElement } from "react";
import { useDocumentPane } from "sanity/structure";
import { AddIcon, TranslateIcon, RemoveCircleIcon } from "@sanity/icons";
import get from "lodash/get.js";
const namespace = "sanity-plugin-internationalized-array", version = "v1", functionCache = /* @__PURE__ */ new Map(), functionKeyCache = /* @__PURE__ */ new WeakMap(), preloadWithKey = (fn, key) => suspend.preload(() => fn(), key), clear = () => suspend.clear([version, namespace]), peek = (selectedValue) => suspend.peek([version, namespace, selectedValue]), createCacheKey = (selectedValue, workspaceId) => {
  const selectedValueHash = JSON.stringify(selectedValue);
  return workspaceId ? [version, namespace, selectedValueHash, workspaceId] : [version, namespace, selectedValueHash];
}, getFunctionKey = (fn) => {
  const cachedKey = functionKeyCache.get(fn);
  if (cachedKey)
    return cachedKey;
  const fnStr = fn.toString();
  let hash = 0;
  const maxLength = Math.min(fnStr.length, 100);
  for (let i = 0; i < maxLength; i++) {
    const char = fnStr.charCodeAt(i);
    hash = (hash << 5) - hash + char, hash &= hash;
  }
  const key = `anonymous_${Math.abs(hash)}`;
  return functionKeyCache.set(fn, key), key;
}, createFunctionCacheKey = (fn, selectedValue, workspaceId) => {
  const functionKey = getFunctionKey(fn), selectedValueHash = JSON.stringify(selectedValue);
  return workspaceId ? `${functionKey}:${selectedValueHash}:${workspaceId}` : `${functionKey}:${selectedValueHash}`;
}, getFunctionCache = (fn, selectedValue, workspaceId) => {
  const key = createFunctionCacheKey(fn, selectedValue, workspaceId);
  return functionCache.get(key);
}, setFunctionCache = (fn, selectedValue, languages, workspaceId) => {
  const key = createFunctionCacheKey(fn, selectedValue, workspaceId);
  functionCache.set(key, languages);
}, MAX_COLUMNS = {
  codeOnly: 5,
  titleOnly: 4,
  titleAndCode: 3
}, CONFIG_DEFAULT = {
  languages: [],
  select: {},
  defaultLanguages: [],
  fieldTypes: [],
  apiVersion: "2022-11-27",
  buttonLocations: ["field"],
  buttonAddAll: !0,
  languageDisplay: "codeOnly"
};
var __defProp$9 = Object.defineProperty, __defProps$8 = Object.defineProperties, __getOwnPropDescs$8 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$9 = Object.getOwnPropertySymbols, __hasOwnProp$9 = Object.prototype.hasOwnProperty, __propIsEnum$9 = Object.prototype.propertyIsEnumerable, __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$9 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$9.call(b, prop) && __defNormalProp$9(a, prop, b[prop]);
  if (__getOwnPropSymbols$9)
    for (var prop of __getOwnPropSymbols$9(b))
      __propIsEnum$9.call(b, prop) && __defNormalProp$9(a, prop, b[prop]);
  return a;
}, __spreadProps$8 = (a, b) => __defProps$8(a, __getOwnPropDescs$8(b));
const getDocumentsToTranslate = (value, rootPath = []) => {
  if (Array.isArray(value)) {
    const arrayRootPath = [...rootPath], internationalizedValues = value.filter((item) => {
      if (Array.isArray(item)) return !1;
      if (typeof item == "object") {
        const type = item == null ? void 0 : item._type;
        return (type == null ? void 0 : type.startsWith("internationalizedArray")) && (type == null ? void 0 : type.endsWith("Value"));
      }
      return !1;
    });
    return internationalizedValues.length > 0 ? internationalizedValues.map((internationalizedValue) => __spreadProps$8(__spreadValues$9({}, internationalizedValue), {
      path: arrayRootPath,
      pathString: arrayRootPath.join(".")
    })) : value.length > 0 ? value.map(
      (item, index) => getDocumentsToTranslate(item, [...arrayRootPath, index])
    ).flat() : [];
  }
  if (typeof value == "object" && value) {
    const startsWithUnderscoreRegex = /^_/;
    return Object.keys(value).filter(
      (key) => !key.match(startsWithUnderscoreRegex)
    ).map((item) => {
      const selectedValue = value[item], path = [...rootPath, item];
      return getDocumentsToTranslate(selectedValue, path);
    }).flat();
  }
  return [];
};
function getLanguageDisplay(languageDisplay, title, code) {
  return languageDisplay === "codeOnly" ? code.toUpperCase() : languageDisplay === "titleOnly" ? title : languageDisplay === "titleAndCode" ? `${title} (${code.toUpperCase()})` : title;
}
function AddButtons(props) {
  const { languages, readOnly, value, onClick } = props, { languageDisplay } = useInternationalizedArrayContext();
  return languages.length > 0 ? /* @__PURE__ */ jsx(
    Grid,
    {
      columns: Math.min(languages.length, MAX_COLUMNS[languageDisplay]),
      gap: 2,
      children: languages.map((language) => {
        const languageTitle = getLanguageDisplay(
          languageDisplay,
          language.title,
          language.id
        );
        return /* @__PURE__ */ jsx(
          Button,
          {
            tone: "primary",
            mode: "ghost",
            fontSize: 1,
            disabled: readOnly || !!(value != null && value.find((item) => item._key === language.id)),
            text: languageTitle,
            icon: languages.length > MAX_COLUMNS[languageDisplay] && languageDisplay === "codeOnly" ? void 0 : AddIcon,
            value: language.id,
            onClick
          },
          language.id
        );
      })
    }
  ) : null;
}
var AddButtons$1 = memo(AddButtons);
function DocumentAddButtons(props) {
  const { filteredLanguages } = useInternationalizedArrayContext(), value = isSanityDocument(props.value) ? props.value : void 0, toast = useToast(), { onChange } = useDocumentPane(), schema = useSchema(), documentsToTranslation = getDocumentsToTranslate(value, []), getInitialValueForType = useCallback(
    (typeName) => {
      var _a;
      if (!typeName) return;
      const match = typeName.match(/^internationalizedArray(.+)Value$/);
      if (!match) return;
      const baseTypeName = match[1].charAt(0).toLowerCase() + match[1].slice(1), arrayBasedTypes = [
        "body",
        "htmlContent",
        "blockContent",
        "portableText"
      ];
      if (arrayBasedTypes.includes(baseTypeName))
        return [];
      try {
        const schemaType = schema.get(typeName);
        if (schemaType) {
          const valueField = (_a = schemaType == null ? void 0 : schemaType.fields) == null ? void 0 : _a.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (f) => f.name === "value"
          );
          if (valueField) {
            const fieldType = valueField.type;
            if ((fieldType == null ? void 0 : fieldType.jsonType) === "array" || (fieldType == null ? void 0 : fieldType.name) === "array" || (fieldType == null ? void 0 : fieldType.type) === "array" || (fieldType == null ? void 0 : fieldType.of) !== void 0 || arrayBasedTypes.includes(fieldType == null ? void 0 : fieldType.name))
              return [];
          }
        }
      } catch (error) {
        console.warn(
          "Could not determine field type from schema:",
          typeName,
          error
        );
      }
    },
    [schema]
  ), handleDocumentButtonClick = useCallback(
    async (event) => {
      const languageId = event.currentTarget.value;
      if (!languageId) {
        toast.push({
          status: "error",
          title: "No language selected"
        });
        return;
      }
      const alreadyTranslated = documentsToTranslation.filter(
        (translation) => (translation == null ? void 0 : translation._key) === languageId
      ), removeDuplicates = documentsToTranslation.reduce((filteredTranslations, translation) => alreadyTranslated.filter(
        (alreadyTranslation) => alreadyTranslation.pathString === translation.pathString
      ).length > 0 || filteredTranslations.filter(
        (filteredTranslation) => filteredTranslation.path === translation.path
      ).length > 0 ? filteredTranslations : [...filteredTranslations, translation], []);
      if (removeDuplicates.length === 0) {
        toast.push({
          status: "error",
          title: "No internationalizedArray fields found in document root"
        });
        return;
      }
      const patches = [];
      for (const toTranslate of removeDuplicates) {
        const path = toTranslate.path, initialValue = getInitialValueForType(toTranslate._type), ifMissing = setIfMissing([], path), insertValue = insert(
          [
            {
              _key: languageId,
              _type: toTranslate._type,
              value: initialValue
              // Use the determined initial value instead of undefined
            }
          ],
          "after",
          [...path, -1]
        );
        patches.push(ifMissing), patches.push(insertValue);
      }
      onChange(PatchEvent.from(patches.flat()));
    },
    [documentsToTranslation, getInitialValueForType, onChange, toast]
  );
  return /* @__PURE__ */ jsxs(Stack, { space: 3, children: [
    /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Text, { size: 1, weight: "semibold", children: "Add translation to internationalized fields" }) }),
    /* @__PURE__ */ jsx(
      AddButtons$1,
      {
        languages: filteredLanguages,
        readOnly: !1,
        value: void 0,
        onClick: handleDocumentButtonClick
      }
    )
  ] });
}
const getSelectedValue = (select, document) => {
  if (!select || !document)
    return {};
  const selection = select || {}, selectedValue = {};
  for (const [key, path] of Object.entries(selection)) {
    let value = get(document, path);
    Array.isArray(value) && (value = value.filter(
      (item) => typeof item == "object" ? (item == null ? void 0 : item._type) === "reference" && "_ref" in item : !0
    )), selectedValue[key] = value;
  }
  return selectedValue;
};
var __defProp$8 = Object.defineProperty, __defProps$7 = Object.defineProperties, __getOwnPropDescs$7 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$8 = Object.getOwnPropertySymbols, __hasOwnProp$8 = Object.prototype.hasOwnProperty, __propIsEnum$8 = Object.prototype.propertyIsEnumerable, __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$8 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$8.call(b, prop) && __defNormalProp$8(a, prop, b[prop]);
  if (__getOwnPropSymbols$8)
    for (var prop of __getOwnPropSymbols$8(b))
      __propIsEnum$8.call(b, prop) && __defNormalProp$8(a, prop, b[prop]);
  return a;
}, __spreadProps$7 = (a, b) => __defProps$7(a, __getOwnPropDescs$7(b));
const InternationalizedArrayContext = createContext(__spreadProps$7(__spreadValues$8({}, CONFIG_DEFAULT), {
  languages: [],
  filteredLanguages: []
}));
function useInternationalizedArrayContext() {
  return useContext(InternationalizedArrayContext);
}
function InternationalizedArrayProvider(props) {
  const { internationalizedArray: internationalizedArray2 } = props, client = useClient({ apiVersion: internationalizedArray2.apiVersion }), workspace = useWorkspace(), { formState } = useDocumentPane(), deferredDocument = useDeferredValue(formState == null ? void 0 : formState.value), selectedValue = useMemo(
    () => getSelectedValue(internationalizedArray2.select, deferredDocument),
    [internationalizedArray2.select, deferredDocument]
  ), workspaceId = useMemo(() => {
    if (workspace != null && workspace.name)
      return workspace.name;
    const workspaceKey = {
      name: workspace == null ? void 0 : workspace.name,
      title: workspace == null ? void 0 : workspace.title
      // Add other stable properties as needed
    };
    return JSON.stringify(workspaceKey);
  }, [workspace]), cacheKey = useMemo(
    () => createCacheKey(selectedValue, workspaceId),
    [selectedValue, workspaceId]
  ), languages = Array.isArray(internationalizedArray2.languages) ? internationalizedArray2.languages : suspend$1(
    // eslint-disable-next-line require-await
    async () => {
      if (typeof internationalizedArray2.languages == "function") {
        const result = await internationalizedArray2.languages(
          client,
          selectedValue
        );
        return setFunctionCache(
          internationalizedArray2.languages,
          selectedValue,
          result,
          workspaceId
        ), result;
      }
      return internationalizedArray2.languages;
    },
    cacheKey,
    { equal }
  ), { selectedLanguageIds, options: languageFilterOptions } = useLanguageFilterStudioContext(), filteredLanguages = useMemo(() => {
    const documentType = deferredDocument ? deferredDocument._type : void 0;
    return typeof documentType == "string" && languageFilterOptions.documentTypes.includes(documentType) ? languages.filter(
      (language) => selectedLanguageIds.includes(language.id)
    ) : languages;
  }, [deferredDocument, languageFilterOptions, languages, selectedLanguageIds]), showDocumentButtons = internationalizedArray2.buttonLocations.includes("document"), context = useMemo(
    () => __spreadProps$7(__spreadValues$8({}, internationalizedArray2), { languages, filteredLanguages }),
    [filteredLanguages, internationalizedArray2, languages]
  );
  return /* @__PURE__ */ jsx(InternationalizedArrayContext.Provider, { value: context, children: showDocumentButtons ? /* @__PURE__ */ jsxs(Stack, { space: 5, children: [
    /* @__PURE__ */ jsx(DocumentAddButtons, { value: props.value }),
    props.renderDefault(props)
  ] }) : props.renderDefault(props) });
}
var __defProp$7 = Object.defineProperty, __defProps$6 = Object.defineProperties, __getOwnPropDescs$6 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$7 = Object.getOwnPropertySymbols, __hasOwnProp$7 = Object.prototype.hasOwnProperty, __propIsEnum$7 = Object.prototype.propertyIsEnumerable, __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$7 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$7.call(b, prop) && __defNormalProp$7(a, prop, b[prop]);
  if (__getOwnPropSymbols$7)
    for (var prop of __getOwnPropSymbols$7(b))
      __propIsEnum$7.call(b, prop) && __defNormalProp$7(a, prop, b[prop]);
  return a;
}, __spreadProps$6 = (a, b) => __defProps$6(a, __getOwnPropDescs$6(b));
function InternationalizedField(props) {
  const { languages } = useInternationalizedArrayContext(), customProps = useMemo(() => {
    var _a;
    const pathSegment = props.path.slice(0, -1)[1], languageId = typeof pathSegment == "object" && "_key" in pathSegment ? pathSegment._key : void 0, hasValidLanguageId = languageId ? languages.some((l) => l.id === languageId) : !1, shouldHideTitle = ((_a = props.title) == null ? void 0 : _a.toLowerCase()) === "value" && hasValidLanguageId;
    return __spreadProps$6(__spreadValues$7({}, props), {
      title: shouldHideTitle ? "" : props.title
    });
  }, [props, languages]);
  return customProps.schemaType.name.startsWith("internationalizedArray") ? customProps.schemaType.name === "reference" && customProps.value ? customProps.renderDefault(__spreadProps$6(__spreadValues$7({}, customProps), {
    title: "",
    level: 0
    // Reset the level to avoid nested styling
  })) : customProps.schemaType.name === "string" || customProps.schemaType.name === "number" || customProps.schemaType.name === "text" ? customProps.children : customProps.renderDefault(__spreadProps$6(__spreadValues$7({}, customProps), {
    level: 0
    // Reset the level to avoid nested styling
  })) : customProps.renderDefault(customProps);
}
var Preload = memo(function(props) {
  const client = useClient({ apiVersion: props.apiVersion }), cacheKey = createCacheKey({});
  return Array.isArray(peek({})) || preloadWithKey(async () => {
    if (Array.isArray(props.languages))
      return props.languages;
    const result = await props.languages(client, {});
    return setFunctionCache(props.languages, {}, result), result;
  }, cacheKey), null;
});
function checkAllLanguagesArePresent(languages, value) {
  const filteredLanguageIds = languages.map((l) => l.id), languagesInUseIds = value ? value.map((v) => v._key) : [];
  return languagesInUseIds.length === filteredLanguageIds.length && languagesInUseIds.every((l) => filteredLanguageIds.includes(l));
}
function createAddAllTitle(value, languages) {
  return value != null && value.length ? `Add missing ${languages.length - value.length === 1 ? "language" : "languages"}` : languages.length === 1 ? `Add ${languages[0].title} Field` : "Add all languages";
}
function createValueSchemaTypeName(schemaType) {
  return `${schemaType.name}Value`;
}
var __defProp$6 = Object.defineProperty, __defProps$5 = Object.defineProperties, __getOwnPropDescs$5 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$6 = Object.getOwnPropertySymbols, __hasOwnProp$6 = Object.prototype.hasOwnProperty, __propIsEnum$6 = Object.prototype.propertyIsEnumerable, __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$6 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$6.call(b, prop) && __defNormalProp$6(a, prop, b[prop]);
  if (__getOwnPropSymbols$6)
    for (var prop of __getOwnPropSymbols$6(b))
      __propIsEnum$6.call(b, prop) && __defNormalProp$6(a, prop, b[prop]);
  return a;
}, __spreadProps$5 = (a, b) => __defProps$5(a, __getOwnPropDescs$5(b));
function createAddLanguagePatches(config) {
  const {
    addLanguageKeys,
    schemaType,
    languages,
    filteredLanguages,
    value,
    path = []
  } = config, itemBase = { _type: createValueSchemaTypeName(schemaType) }, newItems = Array.isArray(addLanguageKeys) && addLanguageKeys.length > 0 ? addLanguageKeys.map((id) => __spreadProps$5(__spreadValues$6({}, itemBase), {
    _key: id
  })) : filteredLanguages.filter(
    (language) => value != null && value.length ? !value.find((v) => v._key === language.id) : !0
  ).map((language) => __spreadProps$5(__spreadValues$6({}, itemBase), {
    _key: language.id
  })), languagesInUse = value != null && value.length ? value.map((v) => v) : [];
  return newItems.map((item) => {
    const languageIndex = languages.findIndex((l) => item._key === l.id), remainingLanguages = languages.slice(languageIndex + 1), nextLanguageIndex = languagesInUse.findIndex(
      (l) => (
        // eslint-disable-next-line max-nested-callbacks
        remainingLanguages.find((r) => r.id === l._key)
      )
    );
    return nextLanguageIndex < 0 ? languagesInUse.push(item) : languagesInUse.splice(nextLanguageIndex, 0, item), nextLanguageIndex < 0 ? (
      // No next language (-1), add to end of array
      insert([item], "after", [...path, nextLanguageIndex])
    ) : (
      // Next language found, insert before that
      insert([item], "before", [...path, nextLanguageIndex])
    );
  });
}
const createTranslateFieldActions = (fieldActionProps, { languages, filteredLanguages }) => languages.map((language) => {
  const value = useFormValue(fieldActionProps.path), disabled = value && Array.isArray(value) ? !!(value != null && value.find((item) => item._key === language.id)) : !1, hidden = !filteredLanguages.some((f) => f.id === language.id), { onChange } = useDocumentPane(), onAction = useCallback(() => {
    const { schemaType, path } = fieldActionProps, addLanguageKeys = [language.id], patches = createAddLanguagePatches({
      addLanguageKeys,
      schemaType,
      languages,
      filteredLanguages,
      value,
      path
    });
    onChange(PatchEvent.from([setIfMissing([], path), ...patches]));
  }, [language.id, value, onChange]);
  return {
    type: "action",
    icon: AddIcon,
    onAction,
    title: language.title,
    hidden,
    disabled
  };
}), AddMissingTranslationsFieldAction = (fieldActionProps, { languages, filteredLanguages }) => {
  const value = useFormValue(fieldActionProps.path), disabled = value && value.length === filteredLanguages.length, hidden = checkAllLanguagesArePresent(filteredLanguages, value), { onChange } = useDocumentPane(), onAction = useCallback(() => {
    const { schemaType, path } = fieldActionProps, patches = createAddLanguagePatches({
      addLanguageKeys: [],
      schemaType,
      languages,
      filteredLanguages,
      value,
      path
    });
    onChange(PatchEvent.from([setIfMissing([], path), ...patches]));
  }, [fieldActionProps, filteredLanguages, languages, onChange, value]);
  return {
    type: "action",
    icon: AddIcon,
    onAction,
    title: createAddAllTitle(value, filteredLanguages),
    disabled,
    hidden
  };
}, internationalizedArrayFieldAction = defineDocumentFieldAction({
  name: "internationalizedArray",
  useAction(fieldActionProps) {
    var _a, _b;
    const isInternationalizedArrayField = (_b = (_a = fieldActionProps == null ? void 0 : fieldActionProps.schemaType) == null ? void 0 : _a.type) == null ? void 0 : _b.name.startsWith(
      "internationalizedArray"
    ), { languages, filteredLanguages } = useInternationalizedArrayContext(), translateFieldActions = createTranslateFieldActions(
      fieldActionProps,
      { languages, filteredLanguages }
    );
    return {
      type: "group",
      icon: TranslateIcon,
      title: "Add Translation",
      renderAsButton: !0,
      children: isInternationalizedArrayField ? [
        ...translateFieldActions,
        AddMissingTranslationsFieldAction(fieldActionProps, {
          languages,
          filteredLanguages
        })
      ] : [],
      hidden: !isInternationalizedArrayField
    };
  }
});
function camelCase(string) {
  return string.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
function titleCase(string) {
  return string.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function pascalCase(string) {
  return titleCase(camelCase(string));
}
function createFieldName(name, addValue = !1) {
  return addValue ? ["internationalizedArray", pascalCase(name), "Value"].join("") : ["internationalizedArray", pascalCase(name)].join("");
}
const schemaExample = {
  languages: [
    { id: "en", title: "English" },
    { id: "no", title: "Norsk" }
  ]
};
function Feedback() {
  return /* @__PURE__ */ jsx(Card, { tone: "caution", border: !0, radius: 2, padding: 3, children: /* @__PURE__ */ jsxs(Stack, { space: 4, children: [
    /* @__PURE__ */ jsxs(Text, { children: [
      "An array of language objects must be passed into the",
      " ",
      /* @__PURE__ */ jsx("code", { children: "internationalizedArray" }),
      " helper function, each with an",
      " ",
      /* @__PURE__ */ jsx("code", { children: "id" }),
      " and ",
      /* @__PURE__ */ jsx("code", { children: "title" }),
      " field. Example:"
    ] }),
    /* @__PURE__ */ jsx(Card, { padding: 2, border: !0, radius: 2, children: /* @__PURE__ */ jsx(Code, { size: 1, language: "javascript", children: JSON.stringify(schemaExample, null, 2) }) })
  ] }) });
}
var __defProp$5 = Object.defineProperty, __defProps$4 = Object.defineProperties, __getOwnPropDescs$4 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$5 = Object.getOwnPropertySymbols, __hasOwnProp$5 = Object.prototype.hasOwnProperty, __propIsEnum$5 = Object.prototype.propertyIsEnumerable, __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$5 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$5.call(b, prop) && __defNormalProp$5(a, prop, b[prop]);
  if (__getOwnPropSymbols$5)
    for (var prop of __getOwnPropSymbols$5(b))
      __propIsEnum$5.call(b, prop) && __defNormalProp$5(a, prop, b[prop]);
  return a;
}, __spreadProps$4 = (a, b) => __defProps$4(a, __getOwnPropDescs$4(b));
function InternationalizedArray(props) {
  const { members, value, schemaType, onChange } = props, readOnly = typeof schemaType.readOnly == "boolean" ? schemaType.readOnly : !1, toast = useToast(), {
    languages,
    filteredLanguages,
    defaultLanguages,
    buttonAddAll,
    buttonLocations
  } = useInternationalizedArrayContext(), { selectedLanguageIds, options: languageFilterOptions } = useLanguageFilterStudioContext(), documentType = useFormValue(["_type"]), languageFilterEnabled = typeof documentType == "string" && languageFilterOptions.documentTypes.includes(documentType), filteredMembers = useMemo(
    () => languageFilterEnabled ? members.filter((member) => {
      if (member.kind !== "item")
        return !1;
      const valueMember = member.item.members[0];
      return valueMember.kind !== "field" ? !1 : languageFilterOptions.filterField(
        member.item.schemaType,
        valueMember,
        selectedLanguageIds
      );
    }) : members,
    [languageFilterEnabled, members, languageFilterOptions, selectedLanguageIds]
  ), handleAddLanguage = useCallback(
    async (param) => {
      var _a;
      if (!(filteredLanguages != null && filteredLanguages.length))
        return;
      const addLanguageKeys = Array.isArray(param) ? param : [(_a = param == null ? void 0 : param.currentTarget) == null ? void 0 : _a.value].filter(Boolean), patches = createAddLanguagePatches({
        addLanguageKeys,
        schemaType,
        languages,
        filteredLanguages,
        value
      });
      onChange([setIfMissing([]), ...patches]);
    },
    [filteredLanguages, languages, onChange, schemaType, value]
  ), { isDeleting } = useDocumentPane(), addedLanguages = members.map(({ key }) => key), hasAddedDefaultLanguages = defaultLanguages.filter((language) => languages.find((l) => l.id === language)).every((language) => addedLanguages.includes(language));
  useEffect(() => {
    if (!isDeleting && !hasAddedDefaultLanguages) {
      const languagesToAdd = defaultLanguages.filter((language) => !addedLanguages.includes(language)).filter((language) => languages.find((l) => l.id === language)), timeout = setTimeout(() => handleAddLanguage(languagesToAdd));
      return () => clearTimeout(timeout);
    }
  }, [
    isDeleting,
    hasAddedDefaultLanguages,
    handleAddLanguage,
    defaultLanguages,
    addedLanguages,
    languages
  ]);
  const handleRestoreOrder = useCallback(() => {
    if (!(value != null && value.length) || !(languages != null && languages.length))
      return;
    const updatedValue = value.reduce((acc, v) => {
      const newIndex = languages.findIndex((l) => l.id === (v == null ? void 0 : v._key));
      return newIndex > -1 && (acc[newIndex] = v), acc;
    }, []).filter(Boolean);
    (value == null ? void 0 : value.length) !== updatedValue.length && toast.push({
      title: "There was an error reordering languages",
      status: "warning"
    }), onChange(set(updatedValue));
  }, [toast, languages, onChange, value]), allKeysAreLanguages = useMemo(() => !(value != null && value.length) || !(languages != null && languages.length) ? !0 : value == null ? void 0 : value.every((v) => languages.find((l) => (l == null ? void 0 : l.id) === (v == null ? void 0 : v._key))), [value, languages]), languagesInUse = useMemo(
    () => languages && languages.length > 1 ? languages.filter((l) => value == null ? void 0 : value.find((v) => v._key === l.id)) : [],
    [languages, value]
  ), languagesOutOfOrder = useMemo(() => !(value != null && value.length) || !languagesInUse.length ? [] : value.map(
    (v, vIndex) => vIndex === languagesInUse.findIndex((l) => l.id === v._key) ? null : v
  ).filter(Boolean), [value, languagesInUse]), languagesAreValid = useMemo(
    () => !(languages != null && languages.length) || (languages == null ? void 0 : languages.length) && languages.every((item) => item.id && item.title),
    [languages]
  );
  useEffect(() => {
    languagesOutOfOrder.length > 0 && allKeysAreLanguages && handleRestoreOrder();
  }, [languagesOutOfOrder, allKeysAreLanguages, handleRestoreOrder]);
  const allLanguagesArePresent = useMemo(
    () => checkAllLanguagesArePresent(filteredLanguages, value),
    [filteredLanguages, value]
  );
  if (!languagesAreValid)
    return /* @__PURE__ */ jsx(Feedback, {});
  const addButtonsAreVisible = (
    // Plugin was configured to display buttons here (default!)
    buttonLocations.includes("field") && // There's at least one language visible
    (filteredLanguages == null ? void 0 : filteredLanguages.length) > 0 && // Not every language has a value yet
    !allLanguagesArePresent
  ), fieldHasMembers = (members == null ? void 0 : members.length) > 0;
  return /* @__PURE__ */ jsxs(Stack, { space: 2, children: [
    fieldHasMembers ? /* @__PURE__ */ jsx(Fragment, { children: filteredMembers.map((member) => member.kind === "item" ? /* @__PURE__ */ createElement(
      ArrayOfObjectsItem,
      __spreadProps$4(__spreadValues$5({}, props), {
        key: member.key,
        member
      })
    ) : /* @__PURE__ */ jsx(MemberItemError, { member }, member.key)) }) : null,
    !addButtonsAreVisible && !fieldHasMembers ? /* @__PURE__ */ jsx(Card, { border: !0, tone: "transparent", padding: 3, radius: 2, children: /* @__PURE__ */ jsx(Text, { size: 1, children: "This internationalized field currently has no translations." }) }) : null,
    addButtonsAreVisible ? /* @__PURE__ */ jsxs(Stack, { space: 2, children: [
      /* @__PURE__ */ jsx(
        AddButtons$1,
        {
          languages: filteredLanguages,
          value,
          readOnly,
          onClick: handleAddLanguage
        }
      ),
      buttonAddAll ? /* @__PURE__ */ jsx(
        Button,
        {
          tone: "primary",
          mode: "ghost",
          disabled: readOnly || allLanguagesArePresent,
          icon: AddIcon,
          text: createAddAllTitle(value, filteredLanguages),
          onClick: handleAddLanguage
        }
      ) : null
    ] }) : null
  ] });
}
function getLanguagesFieldOption(schemaType) {
  var _a;
  return schemaType ? ((_a = schemaType.options) == null ? void 0 : _a.languages) || getLanguagesFieldOption(schemaType.type) : void 0;
}
var __defProp$4 = Object.defineProperty, __defProps$3 = Object.defineProperties, __getOwnPropDescs$3 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$4 = Object.getOwnPropertySymbols, __hasOwnProp$4 = Object.prototype.hasOwnProperty, __propIsEnum$4 = Object.prototype.propertyIsEnumerable, __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$4 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$4.call(b, prop) && __defNormalProp$4(a, prop, b[prop]);
  if (__getOwnPropSymbols$4)
    for (var prop of __getOwnPropSymbols$4(b))
      __propIsEnum$4.call(b, prop) && __defNormalProp$4(a, prop, b[prop]);
  return a;
}, __spreadProps$3 = (a, b) => __defProps$3(a, __getOwnPropDescs$3(b)), array = (config) => {
  const { apiVersion, select, languages, type } = config, typeName = typeof type == "string" ? type : type.name, arrayName = createFieldName(typeName), objectName = createFieldName(typeName, !0);
  return defineField({
    name: arrayName,
    title: "Internationalized array",
    type: "array",
    components: {
      input: InternationalizedArray
    },
    options: {
      // @ts-expect-error - these options are required for validation rules – not the custom input component
      apiVersion,
      select,
      languages
    },
    of: [
      defineField(__spreadProps$3(__spreadValues$4({}, typeof type == "string" ? {} : type), {
        name: objectName,
        type: objectName
      }))
    ],
    // @ts-expect-error - fix typings
    validation: (rule) => rule.custom(async (value, context) => {
      var _a;
      if (!value || value.length === 0 || value.length === 1 && !((_a = value[0]) != null && _a._key))
        return !0;
      const selectedValue = getSelectedValue(select, context.document), client = context.getClient({ apiVersion });
      let contextLanguages = [];
      const languagesFieldOption = getLanguagesFieldOption(context == null ? void 0 : context.type);
      if (Array.isArray(languagesFieldOption))
        contextLanguages = languagesFieldOption;
      else if (Array.isArray(peek(selectedValue)))
        contextLanguages = peek(selectedValue) || [];
      else if (typeof languagesFieldOption == "function") {
        const cachedLanguages = getFunctionCache(
          languagesFieldOption,
          selectedValue
        );
        if (Array.isArray(cachedLanguages))
          contextLanguages = cachedLanguages;
        else {
          const suspendCachedLanguages = peek(selectedValue);
          Array.isArray(suspendCachedLanguages) ? contextLanguages = suspendCachedLanguages : (contextLanguages = await languagesFieldOption(
            client,
            selectedValue
          ), setFunctionCache(
            languagesFieldOption,
            selectedValue,
            contextLanguages
          ));
        }
      }
      if (value && value.length > contextLanguages.length)
        return `Cannot be more than ${contextLanguages.length === 1 ? "1 item" : `${contextLanguages.length} items`}`;
      const languageIds = new Set(contextLanguages.map((lang) => lang.id)), nonLanguageKeys = value.filter(
        (item) => (item == null ? void 0 : item._key) && !languageIds.has(item._key)
      );
      if (nonLanguageKeys.length)
        return {
          message: "Array item keys must be valid languages registered to the field type",
          paths: nonLanguageKeys.map((item) => [{ _key: item._key }])
        };
      const seenKeys = /* @__PURE__ */ new Set(), duplicateValues = [];
      for (const item of value)
        item != null && item._key && (seenKeys.has(item._key) ? duplicateValues.push(item) : seenKeys.add(item._key));
      return duplicateValues.length ? {
        message: "There can only be one field per language",
        paths: duplicateValues.map((item) => [{ _key: item._key }])
      } : !0;
    })
  });
};
function getToneFromValidation(validations) {
  if (!(validations != null && validations.length))
    return;
  const validationLevels = validations.map((v) => v.level);
  if (validationLevels.includes("error"))
    return "critical";
  if (validationLevels.includes("warning"))
    return "caution";
}
var __defProp$3 = Object.defineProperty, __defProps$2 = Object.defineProperties, __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$3 = Object.getOwnPropertySymbols, __hasOwnProp$3 = Object.prototype.hasOwnProperty, __propIsEnum$3 = Object.prototype.propertyIsEnumerable, __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$3 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$3.call(b, prop) && __defNormalProp$3(a, prop, b[prop]);
  if (__getOwnPropSymbols$3)
    for (var prop of __getOwnPropSymbols$3(b))
      __propIsEnum$3.call(b, prop) && __defNormalProp$3(a, prop, b[prop]);
  return a;
}, __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
function InternationalizedInput(props) {
  const parentValue = useFormValue(
    props.path.slice(0, -1)
  ), originalOnChange = props.inputProps.onChange, wrappedOnChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (patches) => {
      var _a;
      if (!Array.isArray(patches))
        return originalOnChange(patches);
      const valueField = (_a = props.value) == null ? void 0 : _a.value;
      if ((valueField == null || Array.isArray(valueField) && valueField.length === 0) && patches.some((patch) => !patch || typeof patch != "object" ? !1 : patch.type === "insert" && patch.path && Array.isArray(patch.path) && patch.path.length > 0 ? patch.path[0] === "value" || typeof patch.path[0] == "number" : !1)) {
        const initPatch = valueField === void 0 ? { type: "setIfMissing", path: ["value"], value: [] } : null, fixedPatches = patches.map((patch) => {
          if (!patch || typeof patch != "object")
            return patch;
          if (patch.type === "insert" && patch.path && Array.isArray(patch.path)) {
            const fixedPath = patch.path[0] === "value" ? patch.path : ["value", ...patch.path];
            return __spreadProps$2(__spreadValues$3({}, patch), { path: fixedPath });
          }
          return patch;
        }), allPatches = initPatch ? [initPatch, ...fixedPatches] : fixedPatches;
        return originalOnChange(allPatches);
      }
      return originalOnChange(patches);
    },
    [props.value, originalOnChange]
  ), inlineProps = __spreadProps$2(__spreadValues$3({}, props.inputProps), {
    // This is the magic that makes inline editing work?
    members: props.inputProps.members.filter(
      (m) => m.kind === "field" && m.name === "value"
    ),
    // This just overrides the type
    // Remove this as it shouldn't be necessary?
    value: props.value,
    // Use our wrapped onChange handler
    onChange: wrappedOnChange
  }), { validation, value, onChange, readOnly } = inlineProps, { languages, languageDisplay, defaultLanguages } = useInternationalizedArrayContext(), languageKeysInUse = useMemo(
    () => {
      var _a;
      return (_a = parentValue == null ? void 0 : parentValue.map((v) => v._key)) != null ? _a : [];
    },
    [parentValue]
  ), keyIsValid = languages != null && languages.length ? languages.find((l) => l.id === value._key) : !1, handleKeyChange = useCallback(
    (event) => {
      var _a;
      const languageId = (_a = event == null ? void 0 : event.currentTarget) == null ? void 0 : _a.value;
      !value || !(languages != null && languages.length) || !languages.find((l) => l.id === languageId) || onChange([set(languageId, ["_key"])]);
    },
    [onChange, value, languages]
  ), handleUnset = useCallback(() => {
    onChange(unset());
  }, [onChange]);
  if (!languages)
    return /* @__PURE__ */ jsx(Spinner, {});
  const language = languages.find((l) => l.id === value._key), languageTitle = keyIsValid && language ? getLanguageDisplay(languageDisplay, language.title, language.id) : "", isDefault = defaultLanguages.includes(value._key), removeButton = /* @__PURE__ */ jsx(
    Button,
    {
      mode: "bleed",
      icon: RemoveCircleIcon,
      tone: "critical",
      disabled: readOnly || isDefault,
      onClick: handleUnset
    }
  );
  return /* @__PURE__ */ jsx(Card, { paddingTop: 2, tone: getToneFromValidation(validation), children: /* @__PURE__ */ jsxs(Stack, { space: 2, children: [
    /* @__PURE__ */ jsx(Card, { tone: "inherit", children: keyIsValid ? /* @__PURE__ */ jsx(Label, { muted: !0, size: 1, children: languageTitle }) : /* @__PURE__ */ jsx(
      MenuButton,
      {
        button: /* @__PURE__ */ jsx(Button, { fontSize: 1, text: `Change "${value._key}"` }),
        id: `${value._key}-change-key`,
        menu: /* @__PURE__ */ jsx(Menu, { children: languages.map((lang) => /* @__PURE__ */ jsx(
          MenuItem,
          {
            disabled: languageKeysInUse.includes(lang.id),
            fontSize: 1,
            text: lang.id.toLocaleUpperCase(),
            value: lang.id,
            onClick: handleKeyChange
          },
          lang.id
        )) }),
        popover: { portal: !0 }
      }
    ) }),
    /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 2, children: [
      /* @__PURE__ */ jsx(Card, { flex: 1, tone: "inherit", children: props.inputProps.renderInput(inlineProps) }),
      /* @__PURE__ */ jsx(Card, { tone: "inherit", children: isDefault ? /* @__PURE__ */ jsx(
        Tooltip,
        {
          content: /* @__PURE__ */ jsx(Text, { muted: !0, size: 1, children: "Can't remove default language" }),
          fallbackPlacements: ["right", "left"],
          placement: "top",
          portal: !0,
          children: /* @__PURE__ */ jsx("span", { children: removeButton })
        }
      ) : removeButton })
    ] })
  ] }) });
}
var __defProp$2 = Object.defineProperty, __defProps$1 = Object.defineProperties, __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$2 = Object.getOwnPropertySymbols, __hasOwnProp$2 = Object.prototype.hasOwnProperty, __propIsEnum$2 = Object.prototype.propertyIsEnumerable, __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$2 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$2.call(b, prop) && __defNormalProp$2(a, prop, b[prop]);
  if (__getOwnPropSymbols$2)
    for (var prop of __getOwnPropSymbols$2(b))
      __propIsEnum$2.call(b, prop) && __defNormalProp$2(a, prop, b[prop]);
  return a;
}, __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b)), object = (config) => {
  const { type } = config, typeName = typeof type == "string" ? type : type.name, objectName = createFieldName(typeName, !0);
  return defineField({
    name: objectName,
    title: `Internationalized array ${type}`,
    type: "object",
    components: {
      // @ts-expect-error - fix typings
      item: InternationalizedInput
    },
    fields: [
      defineField(__spreadProps$1(__spreadValues$2({}, typeof type == "string" ? { type } : type), {
        name: "value"
      }))
    ],
    preview: {
      select: {
        title: "value",
        subtitle: "_key"
      }
    }
  });
}, __defProp$1 = Object.defineProperty, __getOwnPropSymbols$1 = Object.getOwnPropertySymbols, __hasOwnProp$1 = Object.prototype.hasOwnProperty, __propIsEnum$1 = Object.prototype.propertyIsEnumerable, __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$1.call(b, prop) && __defNormalProp$1(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b))
      __propIsEnum$1.call(b, prop) && __defNormalProp$1(a, prop, b[prop]);
  return a;
};
function flattenSchemaType(schemaType) {
  return isDocumentSchemaType(schemaType) ? extractInnerFields(schemaType.fields, [], 3) : (console.error("Schema type is not a document"), []);
}
function extractInnerFields(fields, path, maxDepth) {
  return path.length >= maxDepth ? [] : fields.reduce((acc, field) => {
    const thisFieldWithPath = __spreadValues$1({ path: [...path, field.name] }, field);
    if (field.type.jsonType === "object") {
      const innerFields = extractInnerFields(
        field.type.fields,
        [...path, field.name],
        maxDepth
      );
      return [...acc, thisFieldWithPath, ...innerFields];
    } else if (field.type.jsonType === "array" && field.type.of.length && field.type.of.some((item) => "fields" in item)) {
      const innerFields = field.type.of.flatMap(
        (innerField) => extractInnerFields(
          // @ts-expect-error - Fix TS assertion for array fields
          innerField.fields,
          [...path, field.name],
          maxDepth
        )
      );
      return [...acc, thisFieldWithPath, ...innerFields];
    }
    return [...acc, thisFieldWithPath];
  }, []);
}
var __defProp = Object.defineProperty, __defProps = Object.defineProperties, __getOwnPropDescs = Object.getOwnPropertyDescriptors, __getOwnPropSymbols = Object.getOwnPropertySymbols, __hasOwnProp = Object.prototype.hasOwnProperty, __propIsEnum = Object.prototype.propertyIsEnumerable, __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b))
      __propIsEnum.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  return a;
}, __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const internationalizedArray = definePlugin((config) => {
  const pluginConfig = __spreadValues(__spreadValues({}, CONFIG_DEFAULT), config), {
    apiVersion = "2022-11-27",
    select,
    languages,
    fieldTypes,
    defaultLanguages,
    buttonLocations
  } = pluginConfig;
  return {
    name: "sanity-plugin-internationalized-array",
    // Preload languages for use throughout the Studio
    studio: Array.isArray(languages) ? void 0 : {
      components: {
        layout: (props) => /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Preload, { apiVersion, languages }),
          props.renderDefault(props)
        ] })
      }
    },
    // Optional: render "add language" buttons as field actions
    document: {
      unstable_fieldActions: buttonLocations.includes("unstable__fieldAction") ? (prev) => [...prev, internationalizedArrayFieldAction] : void 0
    },
    // Wrap document editor with a language provider
    form: {
      components: {
        field: (props) => /* @__PURE__ */ jsx(InternationalizedField, __spreadValues({}, props)),
        input: (props) => !(props.id === "root" && isObjectInputProps(props)) || !flattenSchemaType(props.schemaType).map(
          (field) => field.type.name
        ).some(
          (name) => name.startsWith("internationalizedArray")
        ) ? props.renderDefault(props) : /* @__PURE__ */ jsx(
          InternationalizedArrayProvider,
          __spreadProps(__spreadValues({}, props), {
            internationalizedArray: pluginConfig
          })
        )
      }
    },
    // Register custom schema types for the outer array and the inner object
    schema: {
      types: [
        ...fieldTypes.map(
          (type) => array({ type, apiVersion, select, languages, defaultLanguages })
        ),
        ...fieldTypes.map((type) => object({ type }))
      ]
    }
  };
});
export {
  clear,
  internationalizedArray
};
//# sourceMappingURL=index.mjs.map
