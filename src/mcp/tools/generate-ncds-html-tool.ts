import { z } from "zod";
import type { GetFileResponse, GetFileNodesResponse } from "@figma/rest-api-spec";
import { FigmaService } from "~/services/figma.js";
import { simplifyRawFigmaObject, allExtractors } from "~/extractors/index.js";
import { NcdsHtmlGenerator, type NcdsHtmlGenerationOptions } from "~/generators/ncds-html-generator.js";
import { Logger } from "~/utils/logger.js";

const parameters = {
  fileKey: z
    .string()
    .describe(
      "The key of the Figma file to fetch, often found in a provided URL like figma.com/(file|design)/<fileKey>/...",
    ),
  nodeId: z
    .string()
    .optional()
    .describe(
      "The ID of the node to fetch, often found as URL parameter node-id=<nodeId>, always use if provided",
    ),
  depth: z
    .number()
    .optional()
    .describe(
      "OPTIONAL. Do NOT use unless explicitly requested by the user. Controls how many levels deep to traverse the node tree.",
    ),
  includeCSS: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include NCDS CSS styles in the output"),
  includeComments: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include HTML comments for debugging"),
  phpNamingConvention: z
    .boolean()
    .optional()
    .default(true)
    .describe("Use PHP-style naming conventions for IDs and classes"),
  generateNcdsImports: z
    .boolean()
    .optional()
    .default(true)
    .describe("Generate list of NCDS components used"),
  wrapInContainer: z
    .boolean()
    .optional()
    .default(true)
    .describe("Wrap the generated HTML in a container div"),
  outputFormat: z
    .enum(['html', 'complete'])
    .optional()
    .default('complete')
    .describe("Output format: 'html' for HTML only, 'complete' for HTML + CSS + imports"),
};

const parametersSchema = z.object(parameters);
export type GenerateNcdsHtmlParams = z.infer<typeof parametersSchema>;

async function generateNcdsHtml(
  params: GenerateNcdsHtmlParams,
  figmaService: FigmaService,
) {
  try {
    const { 
      fileKey, 
      nodeId, 
      depth, 
      includeCSS, 
      includeComments, 
      phpNamingConvention, 
      generateNcdsImports, 
      wrapInContainer,
      outputFormat 
    } = params;

    Logger.log(
      `Generating NCDS HTML from ${depth ? `${depth} layers deep` : "all layers"} of ${
        nodeId ? `node ${nodeId} from file` : `full file`
      } ${fileKey}`,
    );

    // Get raw Figma API response
    let rawApiResponse: GetFileResponse | GetFileNodesResponse;
    if (nodeId) {
      rawApiResponse = await figmaService.getRawNode(fileKey, nodeId, depth);
    } else {
      rawApiResponse = await figmaService.getRawFile(fileKey, depth);
    }

    // Extract and simplify design data
    const simplifiedDesign = simplifyRawFigmaObject(rawApiResponse, allExtractors, {
      maxDepth: depth,
    });

    Logger.log(
      `Successfully extracted data: ${simplifiedDesign.nodes.length} nodes, ${Object.keys(simplifiedDesign.globalVars.styles).length} styles`,
    );

    // Generate NCDS HTML
    const options: NcdsHtmlGenerationOptions = {
      includeCSS,
      includeComments,
      phpNamingConvention,
      generateNcdsImports,
      wrapInContainer,
    };

    const htmlGenerator = new NcdsHtmlGenerator(simplifiedDesign.globalVars, options);
    const result = htmlGenerator.generateFromDesign(simplifiedDesign);

    // Format output based on outputFormat parameter
    let output: string;
    if (outputFormat === 'html') {
      output = result.html;
    } else {
      // Complete format with metadata
      const sections: string[] = [];
      
      // Add component usage summary
      if (result.componentUsage && Object.keys(result.componentUsage).length > 0) {
        sections.push('<!-- NCDS Components Used -->');
        sections.push('<!--');
        Object.entries(result.componentUsage).forEach(([component, count]) => {
          sections.push(`  ${component}: ${count} instance(s)`);
        });
        sections.push('-->');
        sections.push('');
      }

      // Add import suggestions
      if (result.imports && result.imports.length > 0) {
        sections.push('<!-- React/JavaScript Import Suggestions -->');
        sections.push('<!--');
        sections.push(`  import { ${result.imports.join(', ')} } from '@ncds/ui-admin';`);
        sections.push('-->');
        sections.push('');
      }

      // Add CSS if requested
      if (result.css && includeCSS) {
        sections.push('<!-- CSS Styles -->');
        sections.push('<style>');
        sections.push(result.css);
        sections.push('</style>');
        sections.push('');
      }

      // Add the HTML content
      sections.push('<!-- Generated HTML -->');
      sections.push(result.html);

      output = sections.join('\n');
    }

    Logger.log("Sending NCDS HTML result to client");
    return {
      content: [{ type: "text" as const, text: output }],
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    Logger.error(`Error generating NCDS HTML for file ${params.fileKey}:`, message);
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Error generating NCDS HTML: ${message}` }],
    };
  }
}

// Export tool configuration
export const generateNcdsHtmlTool = {
  name: "generate_ncds_html",
  description:
    "Generate HTML code using NCDS UI Admin components from Figma design data. This tool maps Figma components to @ncds/ui-admin React components and generates corresponding HTML markup suitable for PHP projects.",
  parameters,
  handler: generateNcdsHtml,
} as const;