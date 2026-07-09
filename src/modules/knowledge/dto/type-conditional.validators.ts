import { registerDecorator, ValidationArguments } from 'class-validator';

interface FieldRuleOptions {
  requiredFor?: string[];
  forbiddenFor?: string[];
  requiredMessage?: string;
  forbiddenMessage?: string;
}

/** Self-contained: string field is required for some types, forbidden (must be empty/absent) for others. */
export function TypeConditionalString(opts: FieldRuleOptions): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    registerDecorator({
      name: 'typeConditionalString',
      target: target.constructor,
      propertyName: propertyKey as string,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const type = (args.object as Record<string, unknown>).type as string;
          const isEmpty = value === undefined || value === null || value === '';
          if (opts.requiredFor?.includes(type) && isEmpty) return false;
          if (opts.forbiddenFor?.includes(type) && !isEmpty) return false;
          return isEmpty || typeof value === 'string';
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;
          const type = obj.type as string;
          const value = obj[args.property];
          const isEmpty = value === undefined || value === null || value === '';
          if (opts.requiredFor?.includes(type) && isEmpty) return opts.requiredMessage || `${args.property} est requis`;
          if (opts.forbiddenFor?.includes(type) && !isEmpty) return opts.forbiddenMessage || `${args.property} n'est pas autorisé pour ce type`;
          return `${args.property} est invalide`;
        },
      },
    });
  };
}

/** Self-contained: array field is required (non-empty) for some types, forbidden (must be empty/absent) for others. */
export function TypeConditionalArray(opts: FieldRuleOptions): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    registerDecorator({
      name: 'typeConditionalArray',
      target: target.constructor,
      propertyName: propertyKey as string,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const type = (args.object as Record<string, unknown>).type as string;
          const isEmpty = value === undefined || value === null || (Array.isArray(value) && value.length === 0);
          if (opts.requiredFor?.includes(type) && isEmpty) return false;
          if (opts.forbiddenFor?.includes(type) && !isEmpty) return false;
          return isEmpty || Array.isArray(value);
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;
          const type = obj.type as string;
          const value = obj[args.property];
          const isEmpty = value === undefined || value === null || (Array.isArray(value) && value.length === 0);
          if (opts.requiredFor?.includes(type) && isEmpty) return opts.requiredMessage || `${args.property} est requis`;
          if (opts.forbiddenFor?.includes(type) && !isEmpty) return opts.forbiddenMessage || `${args.property} n'est pas autorisé pour ce type`;
          return `${args.property} est invalide`;
        },
      },
    });
  };
}

/** Self-contained: requires a nested `{ fr: string }` i18n field's `fr` to be non-empty for the given types. */
export function RequiredI18nFrForTypes(types: string[], message: string): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    registerDecorator({
      name: 'requiredI18nFrForTypes',
      target: target.constructor,
      propertyName: propertyKey as string,
      options: { message },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const type = (args.object as Record<string, unknown>).type as string;
          if (!types.includes(type)) return true;
          const fr = (value as { fr?: string } | undefined)?.fr;
          return typeof fr === 'string' && fr.trim().length > 0;
        },
      },
    });
  };
}

/** Self-contained: tutorial steps required (min 1, each with title.fr + description.fr) when type === 'tutorial', forbidden otherwise. */
export function ValidTutorialSteps(): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    registerDecorator({
      name: 'validTutorialSteps',
      target: target.constructor,
      propertyName: propertyKey as string,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const type = (args.object as Record<string, unknown>).type as string;
          const isEmpty = value === undefined || value === null || (Array.isArray(value) && value.length === 0);
          if (type !== 'tutorial') return isEmpty;
          if (!Array.isArray(value) || value.length === 0) return false;
          return value.every((s: { title?: { fr?: string }; description?: { fr?: string } }) =>
            typeof s?.title?.fr === 'string' && s.title.fr.trim().length > 0 &&
            typeof s?.description?.fr === 'string' && s.description.fr.trim().length > 0,
          );
        },
        defaultMessage(args: ValidationArguments) {
          const type = (args.object as Record<string, unknown>).type as string;
          return type === 'tutorial'
            ? 'Au moins une étape avec titre et description est requise pour un tutoriel'
            : 'Les étapes ne sont autorisées que pour le type Tutoriel';
        },
      },
    });
  };
}
