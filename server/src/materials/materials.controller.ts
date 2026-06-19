import {
    Controller, Get, Post, Put, Patch, Delete,
    Param, Body, Query,
} from '@nestjs/common';
import { MaterialsService } from './materials.service';

@Controller()
export class MaterialsController {
    constructor(private readonly svc: MaterialsService) { }

    // ── Materials ──
    @Get('materials')
    getAllMaterials(@Query('search') search?: string, @Query('category') category?: string) {
        return this.svc.findAllMaterials(search, category);
    }
    @Get('materials/:id')
    getMaterial(@Param('id') id: string) { return this.svc.findMaterial(id); }
    @Post('materials')
    createMaterial(@Body() body: any) { return this.svc.createMaterial(body); }
    @Put('materials/:id')
    updateMaterial(@Param('id') id: string, @Body() body: any) { return this.svc.updateMaterial(id, body); }
    @Delete('materials/:id')
    deleteMaterial(@Param('id') id: string) { return this.svc.deleteMaterial(id); }

    // ── Stores ──
    @Get('stores')
    getAllStores(@Query('type') type?: string) { return this.svc.findAllStores(type); }
    @Get('stores/:id')
    getStore(@Param('id') id: string) { return this.svc.findStore(id); }
    @Post('stores')
    createStore(@Body() body: any) { return this.svc.createStore(body); }
    @Put('stores/:id')
    updateStore(@Param('id') id: string, @Body() body: any) { return this.svc.updateStore(id, body); }
    @Delete('stores/:id')
    deleteStore(@Param('id') id: string) { return this.svc.deleteStore(id); }

    // ── Store Items ──
    @Get('store-items')
    getAllStoreItems() { return this.svc.findAllStoreItems(); }
    @Get('stores/:storeId/items')
    getStoreItems(@Param('storeId') storeId: string) { return this.svc.findStoreItems(storeId); }
    @Post('store-items')
    createStoreItem(@Body() body: any) { return this.svc.createStoreItem(body); }
    @Put('store-items/:id')
    updateStoreItem(@Param('id') id: string, @Body() body: any) { return this.svc.updateStoreItem(id, body); }
    @Delete('store-items/:id')
    deleteStoreItem(@Param('id') id: string) { return this.svc.deleteStoreItem(id); }

    // ── Stock Movements ──
    @Get('stock-movements')
    getAllMovements(@Query('storeId') storeId?: string) { return this.svc.findAllMovements(storeId); }
    @Post('stock-movements')
    createMovement(@Body() body: any) { return this.svc.createMovement(body); }

    // ── Stock Transfers ──
    @Get('stock-transfers')
    getAllTransfers() { return this.svc.findAllTransfers(); }
    @Get('stock-transfers/:id')
    getTransfer(@Param('id') id: string) { return this.svc.findTransfer(id); }
    @Post('stock-transfers')
    createTransfer(@Body() body: any) { return this.svc.createTransfer(body); }
    @Patch('stock-transfers/:id')
    updateTransfer(@Param('id') id: string, @Body() body: any) { return this.svc.updateTransfer(id, body); }

    // ── Material Requests ──
    @Get('material-requests')
    getAllRequests(@Query('status') status?: string) { return this.svc.findAllRequests(status); }
    @Get('material-requests/:id')
    getRequest(@Param('id') id: string) { return this.svc.findRequest(id); }
    @Post('material-requests')
    createRequest(@Body() body: any) { return this.svc.createRequest(body); }
    @Patch('material-requests/:id')
    updateRequest(@Param('id') id: string, @Body() body: any) { return this.svc.updateRequest(id, body); }

    // ── Material Returns ──
    @Get('material-returns')
    getAllReturns(@Query('status') status?: string) { return this.svc.findAllReturns(status); }
    @Get('material-returns/:id')
    getReturn(@Param('id') id: string) { return this.svc.findReturn(id); }
    @Post('material-returns')
    createReturn(@Body() body: any) { return this.svc.createReturn(body); }
    @Patch('material-returns/:id')
    updateReturn(@Param('id') id: string, @Body() body: any) { return this.svc.updateReturn(id, body); }
}
