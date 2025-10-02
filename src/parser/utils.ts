import type {
  AstNode,
  IdentifierNode,
  Scope,
  TypeSpecifierNode,
} from '../ast/index.js';

const getSpecifierIdentifier = (
  specifier: TypeSpecifierNode['specifier']
): IdentifierNode | undefined => {
  if (!specifier) {
    return undefined;
  }

  if (specifier.type === 'identifier') {
    return specifier;
  }

  if (specifier.type === 'struct') {
    return specifier.typeName;
  }

  return undefined;
};

export const renameBindings = (
  scope: Scope,
  mangle: (name: string, node: AstNode) => string
) => {
  for (let [name, binding] of scope.bindings) {
    binding.references.forEach((node) => {
      if (node.type === 'declaration') {
        node.identifier.identifier = mangle(node.identifier.identifier, node);
      } else if (node.type === 'identifier') {
        node.identifier = mangle(node.identifier, node);
      } else if (
        node.type === 'parameter_declaration' &&
        'identifier' in node.declaration
      ) {
        node.declaration.identifier.identifier = mangle(
          node.declaration.identifier.identifier,
          node
        );
      } else if (node.type === 'interface_declarator') {
        /* intentionally empty, for
        layout(std140,column_major) uniform;
        uniform Material
        {
        uniform vec2 prop;
        }
         */
      } else {
        console.log(node);
        throw new Error(`Binding for type ${node.type} not recognized`);
      }
    });
  }
};

export const renameTypes = (
  scope: Scope,
  mangle: (name: string, node: AstNode) => string
) => {
  for (let [name, type] of scope.types) {
    type.references.forEach((node) => {
      if (node.type === 'struct') {
        node.typeName.identifier = mangle(node.typeName.identifier, node);
      } else if (node.type === 'identifier') {
        node.identifier = mangle(node.identifier, node);
      } else if (
        node.type === 'function_call' &&
        'specifier' in node.identifier
      ) {
        const specifierIdentifier = getSpecifierIdentifier(
          node.identifier.specifier
        );

        if (specifierIdentifier) {
          specifierIdentifier.identifier = mangle(
            specifierIdentifier.identifier,
            node
          );
        }
      } else {
        console.log(node);
        throw new Error(`Binding for type ${node.type} not recognized`);
      }
    });
  }
};

export const renameFunctions = (
  scope: Scope,
  mangle: (name: string, node: AstNode) => string
) => {
  for (let [name, binding] of scope.functions) {
    binding.references.forEach((node) => {
      if (node.type === 'function') {
        node['prototype'].header.name.identifier = mangle(
          node['prototype'].header.name.identifier,
          node
        );
      } else if (
        node.type === 'function_call' &&
        node.identifier.type === 'postfix'
      ) {
        const postfixExpression = node.identifier.expression as any;

        if (
          postfixExpression?.identifier &&
          'specifier' in postfixExpression.identifier
        ) {
          const specifierIdentifier = getSpecifierIdentifier(
            postfixExpression.identifier.specifier
          );

          if (specifierIdentifier) {
            specifierIdentifier.identifier = mangle(
              specifierIdentifier.identifier,
              node
            );
          }
        } else if (
          postfixExpression &&
          'specifier' in postfixExpression
        ) {
          const specifierIdentifier = getSpecifierIdentifier(
            postfixExpression.specifier
          );

          if (specifierIdentifier) {
            specifierIdentifier.identifier = mangle(
              specifierIdentifier.identifier,
              node
            );
          }
        }
      } else if (
        node.type === 'function_call' &&
        'specifier' in node.identifier
      ) {
        const specifierIdentifier = getSpecifierIdentifier(
          node.identifier.specifier
        );

        if (specifierIdentifier) {
          specifierIdentifier.identifier = mangle(
            specifierIdentifier.identifier,
            node
          );
        }
        // Structs type names also become constructors. However, their renaming is
        // handled by bindings
      }
      // @note it's not the case with struct anymore???
      //  else if (node.type !== 'struct') {
      //   console.log(node);
      //   throw new Error(`Function for type ${node.type} not recognized`);
      // }
    });
  }
};
